from fastapi import FastAPI, Depends, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
import os
from dotenv import load_dotenv
import uvicorn

from .database import get_db
from .models import Transaction, Category, Subcategory
from .forecasting import generate_forecast, simulate_forecast
from .routes import import_excel, finalize_import, complete_import

# Importation pour Supabase
from .supabase_forecasting import generate_forecast_supabase
SUPABASE_AVAILABLE = True
print("Module Supabase activé")

# Charger les variables d'environnement
load_dotenv()

app = FastAPI(title="MoneyApp API", description="API pour l'application MoneyApp")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les origines autorisées
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sécurité API Key
API_KEY = os.getenv("API_KEY", "dev_key")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    # En mode développement, on peut ignorer la vérification d'API key
    debug_mode = os.getenv("DEBUG", "False").lower() == "true"
    if debug_mode:
        return "dev_key"  # Retourner une clé valide en mode debug
    
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, 
        detail="Clé API invalide"
    )

# Modèles de données
class ForecastParams(BaseModel):
    months_ahead: int = 6
    include_recurring: bool = True
    detailed_categories: bool = True

class SimulationEvent(BaseModel):
    description: str
    amount: float
    is_income: bool
    category_id: str
    subcategory_id: Optional[str] = None
    date: date

class SimulationParams(BaseModel):
    months_ahead: int = 6
    events: List[SimulationEvent] = []

class ForecastResponse(BaseModel):
    dates: List[date]
    forecast: Dict[str, List[float]]
    categories: Optional[Dict[str, Dict[str, List[float]]]] = None
    min_forecast: List[float]
    max_forecast: List[float]
    total_income: float
    total_expense: float
    balance: float

# Routes API
@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API MoneyApp"}

@app.get("/api/test")
async def test_api():
    """
    Route simple pour tester l'API
    """
    current_date = date.today()
    future_dates = [(current_date + timedelta(days=30 * i)).isoformat() for i in range(6)]
    
    # Données fictives simplifiées
    response = {
        "dates": future_dates,
        "forecast": {
            "income": [3000, 3050, 3100, 3150, 3200, 3250],
            "expense": [2500, 2550, 2600, 2650, 2700, 2750]
        },
        "min_forecast": [2800, 2850, 2900, 2950, 3000, 3050],
        "max_forecast": [2700, 2750, 2800, 2850, 2900, 2950],
        "total_income": 18750,
        "total_expense": 15750,
        "balance": 3000
    }
    
    return response

@app.post("/api/forecast", response_model=ForecastResponse)
async def get_forecast(
    params: ForecastParams,
    db = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    Génère une prévision budgétaire basée sur l'historique des transactions.
    """
    try:
        print(f"Paramètres reçus: {params}")
        
        # Méthode standard avec SQLAlchemy
        try:
            result = generate_forecast(
                db=db, 
                months_ahead=params.months_ahead,
                include_recurring=params.include_recurring,
                detailed_categories=params.detailed_categories
            )
            print(f"Prévision générée avec succès via SQLAlchemy")
            return result
        except Exception as db_error:
            print(f"Erreur lors de la génération des prévisions via SQLAlchemy: {str(db_error)}")
            
            # Si Supabase est disponible, essayer cette méthode en cas d'échec de SQLAlchemy
            if SUPABASE_AVAILABLE:
                print("Tentative de génération des prévisions via Supabase...")
                try:
                    result = generate_forecast_supabase(
                        months_ahead=params.months_ahead,
                        detailed_categories=params.detailed_categories
                    )
                    if result:
                        print("Prévisions Supabase générées avec succès")
                        return result
                except Exception as supabase_error:
                    print(f"Erreur lors de l'utilisation de Supabase: {supabase_error}")
                    # Relancer l'erreur originale si Supabase échoue aussi
                    raise db_error
            else:
                # Si Supabase n'est pas disponible, relancer l'erreur originale
                raise db_error
    except Exception as e:
        import traceback
        print(f"Erreur de prévision: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération des prévisions: {str(e)}"
        )

@app.post("/api/forecast/supabase", response_model=ForecastResponse)
async def get_forecast_supabase(
    params: ForecastParams,
    api_key: str = Depends(get_api_key)
):
    """
    Génère une prévision budgétaire basée uniquement sur les données Supabase.
    """
    if not SUPABASE_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Fonctionnalité Supabase non disponible"
        )
        
    try:
        print(f"Paramètres reçus pour Supabase: {params}")
        
        # Récupérer les données historiques pour vérification
        historical_data = prepare_historical_data_supabase()
        if historical_data.empty:
            print("ATTENTION: Aucune donnée historique trouvée pour les prévisions")
        else:
            print(f"Données historiques récupérées: {len(historical_data)} entrées")
            print(f"Revenus historiques totaux: {historical_data['y_income'].sum()}")
            print(f"Dépenses historiques totales: {historical_data['y_expense'].sum()}")
        
        # Générer les prévisions
        try:
            result = generate_forecast_supabase(
                months_ahead=params.months_ahead,
                detailed_categories=params.detailed_categories
            )
        except ValueError as ve:
            print(f"Erreur de valeur lors de la génération des prévisions: {ve}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur de configuration Supabase: {str(ve)}"
            )
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de la génération des prévisions Supabase"
            )
            
        print(f"Résultat généré avec succès (Supabase)")
        print(f"Revenus prévisionnels totaux: {result['total_income']}")
        print(f"Dépenses prévisionnelles totales: {result['total_expense']}")
        print(f"Balance prévisionnelle: {result['balance']}")
        
        return result
    except Exception as e:
        import traceback
        print(f"Erreur de prévision Supabase: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération des prévisions Supabase: {str(e)}"
        )

@app.post("/api/simulate", response_model=ForecastResponse)
async def simulate(
    params: SimulationParams,
    db = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    Simule l'impact d'événements futurs sur la prévision budgétaire.
    """
    try:
        result = simulate_forecast(
            db=db,
            months_ahead=params.months_ahead,
            events=params.events
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la simulation: {str(e)}"
        )

# Inclure les routes
app.include_router(import_excel.router, prefix="/api", tags=["Import"])
app.include_router(finalize_import.router, prefix="/api", tags=["Import"])
app.include_router(complete_import.router, prefix="/api", tags=["Import"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 