from fastapi import APIRouter, HTTPException, Body, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import os
import json
import logging
import uuid
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from ..database import get_db
from sqlalchemy.orm import Session
from ..models import Transaction, Category, Subcategory

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/complete-import")
async def complete_import(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint pour finaliser l'importation et créer les transactions dans la base de données.
    
    Args:
        data: Contient l'année et le nom du fichier des données validées
        db: Session de base de données
        
    Returns:
        Le nombre de transactions créées
    """
    try:
        year = data.get("year")
        file_name = data.get("fileName")
        user_id = data.get("user_id")
        
        if not year:
            raise HTTPException(status_code=400, detail="Année manquante")
        
        logger.info(f"Finalisation de l'importation pour l'année {year}, fichier: {file_name}, utilisateur: {user_id}")
        
        # Chemin vers le fichier temporaire contenant les données validées
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp")
        
        # Nom du fichier basé sur l'année et le nom du fichier d'origine (sans extension)
        if file_name:
            base_name = os.path.splitext(os.path.basename(file_name))[0]
            validated_file = os.path.join(temp_dir, f"{base_name}_{year}_validated.json")
        else:
            validated_file = os.path.join(temp_dir, f"import_{year}_validated.json")
        
        # Vérifier si le fichier existe
        if not os.path.exists(validated_file):
            logger.error(f"Fichier de données validées non trouvé: {validated_file}")
            raise HTTPException(status_code=404, detail="Données validées non trouvées. Veuillez recommencer l'importation.")
        
        # Charger les données validées
        with open(validated_file, 'r') as f:
            validated_data = json.load(f)
        
        # Récupérer toutes les catégories et sous-catégories pour éviter les requêtes multiples
        categories = {cat.id: cat for cat in db.query(Category).all()}
        subcategories = {subcat.id: subcat for subcat in db.query(Subcategory).all()}
        
        # Créer les transactions
        transactions_created = 0
        
        try:
            for item in validated_data:
                # Créer une nouvelle transaction
                transaction = Transaction(
                    id=str(uuid.uuid4()),
                    description=item.get("description", ""),
                    amount=item.get("amount", 0),
                    is_income=item.get("is_income", False),
                    date=datetime.strptime(item.get("date"), "%Y-%m-%d").date() if item.get("date") else datetime.now().date(),
                    category_id=item.get("category_id"),
                    subcategory_id=item.get("subcategory_id"),
                    user_id=user_id
                )
                
                db.add(transaction)
                transactions_created += 1
            
            # Valider les changements
            db.commit()
            
            # Supprimer le fichier temporaire après importation réussie
            os.remove(validated_file)
            
            logger.info(f"Importation finalisée avec succès: {transactions_created} transactions créées")
            
            return {
                "status": "success",
                "message": f"Importation finalisée avec succès",
                "transactions_count": transactions_created
            }
            
        except SQLAlchemyError as sql_error:
            # En cas d'erreur, annuler les changements
            db.rollback()
            logger.exception(f"Erreur SQL lors de la création des transactions: {str(sql_error)}")
            raise HTTPException(status_code=500, detail=f"Erreur lors de la création des transactions: {str(sql_error)}")
        
    except Exception as e:
        logger.exception(f"Erreur lors de la finalisation de l'importation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la finalisation de l'importation: {str(e)}") 