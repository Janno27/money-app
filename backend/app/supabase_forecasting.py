import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Charger les variables d'environnement
load_dotenv()

# Récupérer les variables d'environnement pour Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

# Vérifier que les variables d'environnement sont définies
if not supabase_url or not supabase_key:
    print("ERREUR: Variables d'environnement Supabase manquantes dans supabase_forecasting.py")
    supabase = None
else:
    try:
        # Créer le client Supabase
        supabase = create_client(supabase_url, supabase_key)
        print("Client Supabase initialisé avec succès dans supabase_forecasting.py")
    except Exception as e:
        print(f"ERREUR lors de l'initialisation du client Supabase dans supabase_forecasting.py: {e}")
        supabase = None

def get_transactions_from_supabase() -> pd.DataFrame:
    """
    Récupère les transactions depuis Supabase
    """
    try:
        # Vérifier que le client Supabase est disponible
        if supabase is None:
            print("Client Supabase non disponible. Vérifiez les variables d'environnement.")
            return pd.DataFrame()
            
        # Récupérer les transactions
        print("Récupération des transactions depuis Supabase...")
        response = supabase.table("transactions_with_refunds").select("*").execute()
        
        print(f"Response from Supabase: {response}")
        
        if hasattr(response, 'data') and response.data:
            print(f"Récupéré {len(response.data)} transactions de Supabase")
            
            # Convertir les données en DataFrame pandas
            df = pd.DataFrame(response.data)
            
            # Convertir les colonnes de dates
            if 'accounting_date' in df.columns:
                df['accounting_date'] = pd.to_datetime(df['accounting_date'])
            if 'transaction_date' in df.columns:
                df['transaction_date'] = pd.to_datetime(df['transaction_date'])
                
            # Convertir les montants en float
            if 'amount' in df.columns:
                df['amount'] = df['amount'].astype(float)
                
            # Vérifier si final_amount existe, sinon le calculer
            if 'final_amount' not in df.columns:
                print("La colonne final_amount n'existe pas, utilisation de amount")
                df['final_amount'] = df['amount'].astype(float)
            else:
                df['final_amount'] = df['final_amount'].astype(float)
                
            # Vérifier les valeurs nulles ou NaN
            if df['final_amount'].isnull().any():
                print("Attention: Valeurs nulles détectées dans final_amount, remplacement par amount")
                df.loc[df['final_amount'].isnull(), 'final_amount'] = df.loc[df['final_amount'].isnull(), 'amount']
            
            # Ajouter une colonne pour le mois (YYYY-MM)
            df['month'] = df['accounting_date'].dt.strftime('%Y-%m')
            
            # Afficher un résumé des données pour débogage
            print("Résumé des données:")
            print(f"Nombre total de transactions: {len(df)}")
            print(f"Revenus totaux: {df[df['is_income'] == True]['final_amount'].sum()}")
            print(f"Dépenses totales: {df[df['is_income'] == False]['final_amount'].sum()}")
            
            # Résumé par mois
            monthly_summary = df.groupby(['month', 'is_income'])['final_amount'].sum().reset_index()
            print("Résumé mensuel:")
            print(monthly_summary)
                
            return df
        else:
            print("Aucune donnée reçue de Supabase ou format de réponse incorrect")
            return pd.DataFrame()
    except Exception as e:
        print(f"Erreur lors de la récupération des transactions depuis Supabase: {e}")
        import traceback
        print(traceback.format_exc())
        return pd.DataFrame()

def prepare_historical_data_supabase() -> pd.DataFrame:
    """
    Prépare les données historiques depuis Supabase pour Prophet
    avec agrégation mensuelle
    """
    # Récupérer les transactions depuis Supabase
    df = get_transactions_from_supabase()
    
    if df.empty:
        print("Aucune transaction trouvée, retour d'un DataFrame vide")
        # Si aucune donnée, retourner un DataFrame vide avec les colonnes nécessaires
        return pd.DataFrame(columns=["ds", "y_income", "y_expense"])
    
    # Créer des colonnes séparées pour les revenus et dépenses
    df["income"] = np.where(df["is_income"] == True, df["final_amount"], 0)
    df["expense"] = np.where(df["is_income"] == False, df["final_amount"], 0)
    
    print(f"Données préparées: {df.head()}")
    
    # Agréger par mois - Utilisation de la colonne month préparée précédemment
    monthly_df = df.groupby('month').agg({
        "income": "sum",
        "expense": "sum"
    }).reset_index()
    
    # Trier par date croissante pour assurer que les prévisions sont correctes
    monthly_df = monthly_df.sort_values('month')
    
    print(f"Données mensuelles agrégées: {monthly_df}")
    
    # Convertir la colonne month en timestamp pour Prophet (qui attend une colonne ds)
    monthly_df['ds'] = monthly_df['month'].apply(lambda x: pd.Timestamp(f"{x}-01"))
    
    # Formater pour Prophet
    result_df = pd.DataFrame({
        "ds": monthly_df["ds"],
        "y_income": monthly_df["income"],
        "y_expense": monthly_df["expense"]
    })
    
    print(f"Données formatées pour Prophet: {result_df}")
    
    return result_df

def train_prophet_model_supabase(column: str, months_ahead: int = 6) -> Tuple[Prophet, pd.DataFrame]:
    """
    Entraîne un modèle Prophet sur les données Supabase
    avec fréquence mensuelle
    
    Args:
        column: Colonne à prédire (y_income ou y_expense)
        months_ahead: Nombre de mois à prédire
        
    Returns:
        Tuple contenant le modèle Prophet et les prévisions
    """
    # Récupérer les données
    historical_data = prepare_historical_data_supabase()
    
    if historical_data.empty or len(historical_data) < 3:
        print("Pas assez de données pour entraîner un modèle Prophet")
        return None, None
    
    # Préparer les données pour Prophet
    df = pd.DataFrame({
        'ds': historical_data['ds'],
        'y': historical_data[column]
    })
    
    # Configuration du modèle
    model = Prophet(
        yearly_seasonality=True,  
        weekly_seasonality=False,  # Pas de saisonnalité hebdomadaire à l'échelle mensuelle
        daily_seasonality=False,   # Pas de saisonnalité quotidienne à l'échelle mensuelle
        seasonality_mode='multiplicative',  # Adapter à l'échelle des données
        changepoint_prior_scale=0.05  # Contrôle la flexibilité des tendances
    )
    
    # Entraîner le modèle
    model.fit(df)
    
    # Prédire pour les mois à venir
    future = model.make_future_dataframe(periods=months_ahead, freq='MS')  # 'MS' = début de mois
    
    # Générer les prévisions
    forecast = model.predict(future)
    
    return model, forecast

def generate_forecast_supabase(months_ahead: int = 6, detailed_categories: bool = True) -> Dict[str, Any]:
    """
    Génère des prévisions budgétaires basées sur les données Supabase
    avec agrégation mensuelle
    """
    try:
        print("Génération des prévisions avec Supabase...")
        
        # Vérifier que les variables d'environnement Supabase sont définies
        if not supabase_url or not supabase_key:
            print("ERREUR: Variables d'environnement Supabase manquantes")
            raise ValueError("Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY doivent être définies")
        
        # Obtenir les dates pour les prévisions (premier jour de chaque mois)
        today = date.today()
        future_dates = []
        
        # Générer le premier jour de chaque mois futur
        for i in range(months_ahead):
            # Ajouter un mois
            next_month = today.replace(day=1) + timedelta(days=32 * (i + 1))
            # Revenir au premier jour du mois
            first_day = date(next_month.year, next_month.month, 1)
            future_dates.append(first_day)
        
        # Récupérer les données historiques
        historical_data = prepare_historical_data_supabase()
        
        if historical_data.empty:
            print("Aucune donnée historique trouvée pour les prévisions")
            return {
                "dates": [d.isoformat() for d in future_dates],
                "forecast": {
                    "income": [0] * months_ahead,
                    "expense": [0] * months_ahead
                },
                "min_forecast": [0] * months_ahead,
                "max_forecast": [0] * months_ahead,
                "total_income": 0,
                "total_expense": 0,
                "balance": 0
            }
        
        # Entraîner les modèles Prophet pour revenus et dépenses
        income_model, income_forecast = train_prophet_model_supabase("y_income", months_ahead)
        expense_model, expense_forecast = train_prophet_model_supabase("y_expense", months_ahead)
        
        if income_model is None or expense_model is None:
            print("Échec de l'entraînement des modèles")
            return {
                "dates": [d.isoformat() for d in future_dates],
                "forecast": {
                    "income": [0] * months_ahead,
                    "expense": [0] * months_ahead
                },
                "min_forecast": [0] * months_ahead,
                "max_forecast": [0] * months_ahead,
                "total_income": 0,
                "total_expense": 0,
                "balance": 0
            }
        
        # Extraire les prévisions pour les mois futures uniquement
        income_dates = income_forecast['ds'].dt.date.tolist()
        expense_dates = expense_forecast['ds'].dt.date.tolist()
        
        # Filtrer pour n'obtenir que les prévisions futures
        future_indices = []
        for future_date in future_dates:
            try:
                idx = income_dates.index(future_date)
                future_indices.append(idx)
            except ValueError:
                # Si la date n'est pas trouvée, elle est ignorée
                pass
        
        # Vérifier si nous avons des indices valides
        if not future_indices:
            print("Aucune prévision future trouvée")
            return {
                "dates": [d.isoformat() for d in future_dates],
                "forecast": {
                    "income": [0] * months_ahead,
                    "expense": [0] * months_ahead
                },
                "min_forecast": [0] * months_ahead,
                "max_forecast": [0] * months_ahead,
                "total_income": 0,
                "total_expense": 0,
                "balance": 0
            }
        
        # Récupérer les prévisions pour les mois futurs
        forecasted_income = [income_forecast["yhat"].iloc[idx] for idx in future_indices]
        forecasted_expense = [expense_forecast["yhat"].iloc[idx] for idx in future_indices]
        
        # Prévoir les intervalles min/max
        income_min = [income_forecast["yhat_lower"].iloc[idx] for idx in future_indices]
        income_max = [income_forecast["yhat_upper"].iloc[idx] for idx in future_indices]
        expense_min = [expense_forecast["yhat_lower"].iloc[idx] for idx in future_indices]
        expense_max = [expense_forecast["yhat_upper"].iloc[idx] for idx in future_indices]
        
        # Calcul des totaux
        total_income = sum(forecasted_income)
        total_expense = sum(forecasted_expense)
        balance = total_income - total_expense
        
        # Construction de la réponse
        forecast_data = {
            "dates": [d.isoformat() for d in future_dates],
            "forecast": {
                "income": forecasted_income,
                "expense": forecasted_expense
            },
            "min_forecast": [income_min[i] - expense_max[i] for i in range(len(income_min))],
            "max_forecast": [income_max[i] - expense_min[i] for i in range(len(income_max))],
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance
        }
        
        return forecast_data
        
    except Exception as e:
        print(f"Erreur lors de la génération des prévisions: {e}")
        import traceback
        print(traceback.format_exc())
        raise e 