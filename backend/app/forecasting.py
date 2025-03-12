import pandas as pd
import numpy as np
from prophet import Prophet
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
from .models import Transaction, Category, Subcategory, RecurringEvent
import os

def prepare_historical_data(db: Session) -> pd.DataFrame:
    """
    Prépare les données historiques pour Prophet en agrégeant les transactions
    par mois et en séparant les revenus et dépenses.
    """
    # Requête pour obtenir toutes les transactions avec leurs montants finaux
    transactions_query = db.query(
        Transaction.transaction_date,
        Transaction.is_income,
        Transaction.amount,
        func.coalesce(func.sum(Transaction.amount), 0).label("final_amount")
    ).outerjoin(
        "refunds"  # Jointure sur la relation refunds définie dans le modèle
    ).group_by(
        Transaction.id
    ).order_by(
        Transaction.transaction_date
    ).all()
    
    # Convertir en DataFrame pandas
    df = pd.DataFrame([
        {
            "date": t.transaction_date,
            "is_income": t.is_income,
            "amount": float(t.final_amount)
        }
        for t in transactions_query
    ])
    
    if df.empty:
        # Si aucune donnée, retourner un DataFrame vide avec les colonnes nécessaires
        return pd.DataFrame(columns=["ds", "y_income", "y_expense"])
    
    # Convertir la date au format datetime
    df["date"] = pd.to_datetime(df["date"])
    
    # Créer des colonnes séparées pour les revenus et dépenses
    df["income"] = np.where(df["is_income"], df["amount"], 0)
    df["expense"] = np.where(~df["is_income"], -df["amount"], 0)  # Négatif pour les dépenses
    
    # Agréger par mois
    monthly_df = df.groupby(pd.Grouper(key="date", freq="M")).agg({
        "income": "sum",
        "expense": "sum"
    }).reset_index()
    
    # Renommer les colonnes pour Prophet
    monthly_df.rename(columns={"date": "ds", "income": "y_income", "expense": "y_expense"}, inplace=True)
    
    return monthly_df

def get_recurring_events(db: Session) -> pd.DataFrame:
    """
    Récupère les événements récurrents de la base de données et les prépare
    pour les inclure dans les prévisions.
    """
    recurring_events = db.query(RecurringEvent).filter(RecurringEvent.active == True).all()
    
    if not recurring_events:
        return pd.DataFrame(columns=["date", "amount", "is_income", "category_id", "subcategory_id"])
    
    events_data = []
    today = date.today()
    
    for event in recurring_events:
        start_date = event.start_date
        end_date = event.end_date or (today + timedelta(days=365*2))  # Si pas de date de fin, projeter sur 2 ans
        
        if event.frequency == "monthly":
            step = pd.DateOffset(months=1)
        elif event.frequency == "quarterly":
            step = pd.DateOffset(months=3)
        elif event.frequency == "yearly":
            step = pd.DateOffset(years=1)
        else:
            continue  # Ignorer les fréquences non prises en charge
        
        current_date = start_date
        while current_date <= end_date:
            events_data.append({
                "date": current_date,
                "amount": float(event.amount),
                "is_income": event.is_income,
                "category_id": str(event.category_id),
                "subcategory_id": str(event.subcategory_id) if event.subcategory_id else None
            })
            current_date += step
    
    return pd.DataFrame(events_data)

def train_prophet_model(data: pd.DataFrame, column: str, future_months: int = 6) -> Tuple[Prophet, pd.DataFrame]:
    """
    Entraîne un modèle Prophet sur les données historiques et génère des prévisions.
    """
    # Si les données sont vides, retourner un modèle vide et des prévisions vides
    if data.empty:
        model = Prophet()
        future = pd.DataFrame({
            'ds': pd.date_range(start=date.today(), periods=future_months, freq='M')
        })
        forecast = pd.DataFrame({
            'ds': future['ds'],
            'yhat': np.zeros(len(future)),
            'yhat_lower': np.zeros(len(future)),
            'yhat_upper': np.zeros(len(future))
        })
        return model, forecast
    
    # Préparation des données pour Prophet
    df = data[["ds", column]].rename(columns={column: "y"})
    
    # Entraînement du modèle Prophet
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10.0,
        interval_width=0.8
    )
    model.fit(df)
    
    # Génération des prévisions
    future = model.make_future_dataframe(periods=future_months, freq='M')
    forecast = model.predict(future)
    
    return model, forecast

def prepare_category_forecasts(db: Session, months_ahead: int = 6) -> Dict[str, Dict[str, Any]]:
    """
    Prépare des prévisions pour chaque catégorie et sous-catégorie.
    """
    # Requête pour obtenir toutes les catégories
    categories = db.query(Category).all()
    
    category_forecasts = {}
    
    for category in categories:
        # Récupérer les transactions pour cette catégorie
        transactions = db.query(
            Transaction.transaction_date,
            Transaction.is_income,
            Transaction.amount,
            func.coalesce(func.sum(Transaction.amount), 0).label("final_amount")
        ).filter(
            Transaction.category_id == category.id
        ).outerjoin(
            "refunds"
        ).group_by(
            Transaction.id
        ).order_by(
            Transaction.transaction_date
        ).all()
        
        # Convertir en DataFrame
        df = pd.DataFrame([
            {
                "date": t.transaction_date,
                "is_income": t.is_income,
                "amount": float(t.final_amount)
            }
            for t in transactions
        ])
        
        if df.empty:
            continue
        
        # Convertir la date au format datetime
        df["date"] = pd.to_datetime(df["date"])
        
        # Créer une colonne pour le montant (positif pour revenus, négatif pour dépenses)
        df["value"] = np.where(df["is_income"], df["amount"], -df["amount"])
        
        # Agréger par mois
        monthly_df = df.groupby(pd.Grouper(key="date", freq="M")).agg({
            "value": "sum"
        }).reset_index()
        
        # Renommer les colonnes pour Prophet
        monthly_df.rename(columns={"date": "ds", "value": "y"}, inplace=True)
        
        # Si assez de données, entraîner le modèle Prophet
        if len(monthly_df) >= 3:  # Au moins 3 mois de données
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10.0,
                interval_width=0.8
            )
            model.fit(monthly_df)
            
            # Générer les prévisions
            future = model.make_future_dataframe(periods=months_ahead, freq='M')
            forecast = model.predict(future)
            
            # Stocker les prévisions pour cette catégorie
            category_forecasts[category.name] = {
                "type": category.type,
                "forecast": forecast["yhat"].tail(months_ahead).tolist(),
                "min_forecast": forecast["yhat_lower"].tail(months_ahead).tolist(),
                "max_forecast": forecast["yhat_upper"].tail(months_ahead).tolist(),
                "historical": monthly_df["y"].tolist(),
                "subcategories": {}
            }
            
            # Faire des prévisions pour chaque sous-catégorie
            for subcategory in category.subcategories:
                # Récupérer les transactions pour cette sous-catégorie
                sub_transactions = db.query(
                    Transaction.transaction_date,
                    Transaction.is_income,
                    Transaction.amount,
                    func.coalesce(func.sum(Transaction.amount), 0).label("final_amount")
                ).filter(
                    Transaction.subcategory_id == subcategory.id
                ).outerjoin(
                    "refunds"
                ).group_by(
                    Transaction.id
                ).order_by(
                    Transaction.transaction_date
                ).all()
                
                # Convertir en DataFrame
                sub_df = pd.DataFrame([
                    {
                        "date": t.transaction_date,
                        "is_income": t.is_income,
                        "amount": float(t.final_amount)
                    }
                    for t in sub_transactions
                ])
                
                if sub_df.empty:
                    continue
                
                # Convertir la date au format datetime
                sub_df["date"] = pd.to_datetime(sub_df["date"])
                
                # Créer une colonne pour le montant (positif pour revenus, négatif pour dépenses)
                sub_df["value"] = np.where(sub_df["is_income"], sub_df["amount"], -sub_df["amount"])
                
                # Agréger par mois
                sub_monthly_df = sub_df.groupby(pd.Grouper(key="date", freq="M")).agg({
                    "value": "sum"
                }).reset_index()
                
                # Renommer les colonnes pour Prophet
                sub_monthly_df.rename(columns={"date": "ds", "value": "y"}, inplace=True)
                
                # Si assez de données, entraîner le modèle Prophet
                if len(sub_monthly_df) >= 3:  # Au moins 3 mois de données
                    sub_model = Prophet(
                        yearly_seasonality=True,
                        weekly_seasonality=False,
                        daily_seasonality=False,
                        changepoint_prior_scale=0.05,
                        seasonality_prior_scale=10.0,
                        interval_width=0.8
                    )
                    sub_model.fit(sub_monthly_df)
                    
                    # Générer les prévisions
                    sub_future = sub_model.make_future_dataframe(periods=months_ahead, freq='M')
                    sub_forecast = sub_model.predict(sub_future)
                    
                    # Stocker les prévisions pour cette sous-catégorie
                    category_forecasts[category.name]["subcategories"][subcategory.name] = {
                        "forecast": sub_forecast["yhat"].tail(months_ahead).tolist(),
                        "min_forecast": sub_forecast["yhat_lower"].tail(months_ahead).tolist(),
                        "max_forecast": sub_forecast["yhat_upper"].tail(months_ahead).tolist(),
                        "historical": sub_monthly_df["y"].tolist()
                    }
    
    return category_forecasts

def generate_forecast(
    db: Session,
    months_ahead: int = 6,
    include_recurring: bool = True,
    detailed_categories: bool = True
) -> Dict[str, Any]:
    """
    Génère des prévisions budgétaires basées sur l'historique des transactions.
    """
    
    # Récupérer les données historiques
    historical_data = prepare_historical_data(db)
    
    if historical_data.empty:
        print("Aucune donnée historique trouvée pour les prévisions")
        # Retourner une structure vide mais valide
        today = date.today()
        future_dates = [today.replace(day=1) + timedelta(days=32 * i) for i in range(months_ahead)]
        future_dates = [date(d.year, d.month, 1) for d in future_dates]
        
        return {
            "dates": future_dates,
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
    
    # Entraîner les modèles pour les revenus et dépenses
    income_model, income_forecast = train_prophet_model(historical_data, "y_income", months_ahead)
    expense_model, expense_forecast = train_prophet_model(historical_data, "y_expense", months_ahead)
    
    # Récupérer les événements récurrents si demandé
    recurring_events_df = pd.DataFrame()
    if include_recurring:
        recurring_events_df = get_recurring_events(db)
    
    # Préparer les dates pour les prévisions
    today = date.today()
    future_dates = []
    
    # Générer le premier jour de chaque mois futur
    for i in range(months_ahead):
        # Ajouter un mois
        next_month = today.replace(day=1) + timedelta(days=32 * (i + 1))
        # Revenir au premier jour du mois
        first_day = date(next_month.year, next_month.month, 1)
        future_dates.append(first_day)
    
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
    
    # Récupérer les prévisions pour les mois futurs
    forecasted_income = [income_forecast["yhat"].iloc[idx] for idx in future_indices]
    forecasted_expense = [expense_forecast["yhat"].iloc[idx] for idx in future_indices]
    
    # Ajouter les événements récurrents aux prévisions
    if not recurring_events_df.empty:
        for i, future_date in enumerate(future_dates):
            # Filtrer les événements pour ce mois
            month_events = recurring_events_df[
                (recurring_events_df['date'].dt.year == future_date.year) & 
                (recurring_events_df['date'].dt.month == future_date.month)
            ]
            
            # Ajouter les montants aux prévisions
            if not month_events.empty:
                income_events = month_events[month_events['is_income'] == True]['amount'].sum()
                expense_events = month_events[month_events['is_income'] == False]['amount'].sum()
                
                if i < len(forecasted_income):
                    forecasted_income[i] += income_events
                if i < len(forecasted_expense):
                    forecasted_expense[i] += expense_events
    
    # Prévoir les intervalles min/max
    income_min = [income_forecast["yhat_lower"].iloc[idx] for idx in future_indices]
    income_max = [income_forecast["yhat_upper"].iloc[idx] for idx in future_indices]
    expense_min = [expense_forecast["yhat_lower"].iloc[idx] for idx in future_indices]
    expense_max = [expense_forecast["yhat_upper"].iloc[idx] for idx in future_indices]
    
    # Calcul des totaux
    total_income = sum(forecasted_income)
    total_expense = sum(forecasted_expense)
    balance = total_income - total_expense
    
    # Préparer les prévisions par catégorie si demandé
    categories_forecast = None
    if detailed_categories:
        categories_forecast = prepare_category_forecasts(db, months_ahead)
    
    # Construction de la réponse
    forecast_data = {
        "dates": future_dates,
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
    
    # Ajouter les prévisions par catégorie si disponibles
    if detailed_categories and categories_forecast:
        forecast_data["categories"] = categories_forecast
    
    return forecast_data

def simulate_forecast(
    db: Session,
    months_ahead: int = 6,
    events: List[Dict[str, Any]] = []
) -> Dict[str, Any]:
    """
    Simule l'impact d'événements futurs sur les prévisions budgétaires.
    """
    # D'abord, générer une prévision de base
    base_forecast = generate_forecast(db, months_ahead, include_recurring=True, detailed_categories=True)
    
    # Si aucun événement à simuler, retourner la prévision de base
    if not events:
        return base_forecast
    
    # Préparer les données pour les événements simulés
    future_dates = base_forecast["dates"]
    income_forecast = base_forecast["forecast"]["income"]
    expense_forecast = base_forecast["forecast"]["expense"]
    min_forecast = base_forecast["min_forecast"]
    max_forecast = base_forecast["max_forecast"]
    
    # Traiter chaque événement simulé
    for event in events:
        event_date = event["date"]
        event_amount = event["amount"]
        is_income = event["is_income"]
        
        # Trouver l'index du mois dans nos prévisions
        event_month = date(event_date.year, event_date.month, 1)
        if event_month in future_dates:
            month_index = future_dates.index(event_month)
            
            # Mettre à jour les prévisions
            if is_income:
                income_forecast[month_index] += event_amount
                min_forecast[month_index] += event_amount * 0.9  # Hypothèse conservatrice
                max_forecast[month_index] += event_amount * 1.1  # Hypothèse optimiste
            else:
                expense_forecast[month_index] -= event_amount  # Soustraire car les dépenses sont négatives
                min_forecast[month_index] -= event_amount * 1.1  # Plus pessimiste pour les dépenses
                max_forecast[month_index] -= event_amount * 0.9  # Plus optimiste pour les dépenses
            
            # Mettre à jour les prévisions par catégorie si l'événement a une catégorie
            if "category_id" in event and "categories" in base_forecast:
                category_id = event["category_id"]
                subcategory_id = event.get("subcategory_id")
                
                # Trouver la catégorie correspondante
                category = db.query(Category).filter(Category.id == category_id).first()
                if category:
                    category_name = category.name
                    if category_name in base_forecast["categories"]:
                        cat_forecast = base_forecast["categories"][category_name]["forecast"]
                        if month_index < len(cat_forecast):
                            value_change = event_amount if is_income else -event_amount
                            cat_forecast[month_index] += value_change
                            
                            # Mettre à jour aussi la sous-catégorie si applicable
                            if subcategory_id:
                                subcategory = db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
                                if subcategory and subcategory.name in base_forecast["categories"][category_name]["subcategories"]:
                                    subcat_forecast = base_forecast["categories"][category_name]["subcategories"][subcategory.name]["forecast"]
                                    if month_index < len(subcat_forecast):
                                        subcat_forecast[month_index] += value_change
    
    # Recalculer les totaux
    total_income = sum(income_forecast)
    total_expense = sum(expense_forecast)
    balance = total_income + total_expense
    
    # Mettre à jour la prévision avec les événements simulés
    result = base_forecast.copy()
    result["forecast"]["income"] = income_forecast
    result["forecast"]["expense"] = expense_forecast
    result["min_forecast"] = min_forecast
    result["max_forecast"] = max_forecast
    result["total_income"] = total_income
    result["total_expense"] = total_expense
    result["balance"] = balance
    
    return result 