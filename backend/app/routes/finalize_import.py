from fastapi import APIRouter, HTTPException, Body, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import pandas as pd
import os
import json
import logging
from datetime import datetime
from ..database import get_db
from sqlalchemy.orm import Session
from ..models import Category, Subcategory

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/finalize-import")
async def finalize_import(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint pour valider les données importées et les préparer pour l'importation finale.
    
    Args:
        data: Contient les mappings entre sous-catégories et catégories, l'année et le nom du fichier
        db: Session de base de données
        
    Returns:
        Une liste de transactions validées prêtes à être importées
    """
    try:
        mappings = data.get("mappings", {})
        year = data.get("year")
        file_name = data.get("fileName")
        user_id = data.get("user_id")
        
        if not mappings or not year:
            raise HTTPException(status_code=400, detail="Mappings ou année manquants")
        
        logger.info(f"Validation des données pour l'année {year}, fichier: {file_name}")
        
        # Chemin vers le fichier temporaire contenant les données extraites
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Nom du fichier basé sur l'année et le nom du fichier d'origine (sans extension)
        if file_name:
            base_name = os.path.splitext(os.path.basename(file_name))[0]
            temp_file = os.path.join(temp_dir, f"{base_name}_{year}_extracted.json")
        else:
            temp_file = os.path.join(temp_dir, f"import_{year}_extracted.json")
        
        # Vérifier si le fichier existe
        if not os.path.exists(temp_file):
            logger.error(f"Fichier temporaire non trouvé: {temp_file}")
            raise HTTPException(status_code=404, detail="Données extraites non trouvées. Veuillez recommencer l'importation.")
        
        # Charger les données extraites
        with open(temp_file, 'r') as f:
            extracted_data = json.load(f)
        
        # Récupérer toutes les catégories et sous-catégories
        categories = {cat.name: cat for cat in db.query(Category).all()}
        subcategories = {subcat.name: subcat for subcat in db.query(Subcategory).all()}
        
        # Créer un dictionnaire inversé pour les mappings (sous-catégorie -> catégorie)
        inverse_mappings = {}
        for subcat_name, cat_name in mappings.items():
            inverse_mappings[subcat_name] = cat_name
        
        # Valider et enrichir les données
        validated_data = []
        
        for item in extracted_data:
            subcategory_name = item.get("subcategory")
            if not subcategory_name:
                continue
            
            # Récupérer le nom de la catégorie à partir des mappings
            category_name = inverse_mappings.get(subcategory_name)
            if not category_name:
                logger.warning(f"Catégorie non trouvée pour la sous-catégorie: {subcategory_name}")
                continue
            
            # Récupérer les IDs de catégorie et sous-catégorie
            category = categories.get(category_name)
            subcategory = subcategories.get(subcategory_name)
            
            # Créer l'objet transaction validé
            validated_item = {
                "description": item.get("description", ""),
                "amount": item.get("amount", 0),
                "is_income": item.get("is_income", False),
                "date": item.get("date"),
                "category_name": category_name,
                "category_id": category.id if category else None,
                "subcategory_name": subcategory_name,
                "subcategory_id": subcategory.id if subcategory else None
            }
            
            validated_data.append(validated_item)
        
        # Sauvegarder les données validées dans un fichier temporaire
        validated_file = temp_file.replace("_extracted.json", "_validated.json")
        with open(validated_file, 'w') as f:
            json.dump(validated_data, f)
        
        logger.info(f"Données validées avec succès: {len(validated_data)} transactions")
        
        return validated_data
        
    except Exception as e:
        logger.exception(f"Erreur lors de la validation des données: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la validation des données: {str(e)}") 