from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/import-excel")
async def import_excel(
    file: UploadFile = File(...),
    year: Optional[str] = Form(None)
):
    """
    Endpoint pour importer un fichier Excel et extraire les données.
    
    Args:
        file: Le fichier Excel à importer
        year: L'année des données (optionnel)
        
    Returns:
        Un dictionnaire contenant les sous-catégories extraites
    """
    try:
        # Vérifier l'extension du fichier
        if not file.filename.endswith(('.xls', '.xlsx', '.csv')):
            raise HTTPException(status_code=400, detail="Le fichier doit être au format Excel (.xls ou .xlsx) ou CSV (.csv)")
        
        # Créer un répertoire temporaire s'il n'existe pas
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Sauvegarder le fichier temporairement
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Fichier sauvegardé: {file_path}")
        
        # Lire le fichier selon son extension
        if file.filename.endswith('.csv'):
            # Pour les fichiers CSV, essayer différents encodages et délimiteurs
            try:
                # Essayer d'abord avec encoding utf-8 et délimiteur standard
                df = pd.read_csv(file_path, sep=None, engine='python')
            except Exception as csv_error:
                logger.warning(f"Erreur lors de la lecture du CSV avec paramètres par défaut: {csv_error}")
                # Essayer avec encoding latin1 si utf-8 échoue
                try:
                    df = pd.read_csv(file_path, sep=None, engine='python', encoding='latin1')
                except Exception as csv_error2:
                    logger.warning(f"Erreur lors de la lecture du CSV avec encoding latin1: {csv_error2}")
                    # Essayer avec delimiter spécifique pour les CSV français
                    try:
                        df = pd.read_csv(file_path, sep=';', encoding='latin1')
                    except Exception as csv_error3:
                        logger.error(f"Impossible de lire le fichier CSV: {csv_error3}")
                        raise HTTPException(status_code=400, detail=f"Impossible de lire le fichier CSV. Vérifiez le format du fichier.")
        else:
            # Pour les fichiers Excel
            df = pd.read_excel(file_path)
        
        # Afficher les colonnes pour le débogage
        logger.info(f"Colonnes du fichier Excel: {df.columns.tolist()}")
        logger.info(f"Premières lignes du DataFrame:\n{df.head()}")
        
        # Préparer une réponse avec les données brutes pour le frontend
        raw_data = []
        columns = df.columns.tolist()
        
        # Convertir le DataFrame en liste de listes pour la sérialisation JSON
        for _, row in df.iterrows():
            row_data = []
            for val in row:
                # Assurer que toutes les valeurs numériques sont converties en float pour cohérence
                if pd.notna(val):
                    if isinstance(val, (int, float)):
                        row_data.append(float(val))
                    else:
                        row_data.append(str(val))
                else:
                    row_data.append(None)
            raw_data.append(row_data)
        
        # Extraire les sous-catégories uniques
        subcategories = []
        
        # Vérifier si le fichier a un format spécifique (première colonne = sous-catégories)
        if len(df.columns) > 0:
            # Utiliser la première colonne comme sous-catégories
            first_column = df.iloc[:, 0]
            logger.info(f"Première colonne (potentielles sous-catégories): {first_column.head().tolist()}")
            
            # Filtrer les valeurs non vides et non numériques
            subcategories = [str(val) for val in first_column.dropna().unique() if isinstance(val, str) or not pd.isna(val)]
            
            # Exclure les valeurs qui pourraient être des en-têtes
            subcategories = [s for s in subcategories if s.lower() not in ['sous-catégorie', 'subcategory', 'catégorie', 'category']]
            
            logger.info(f"Sous-catégories extraites de la première colonne: {subcategories}")
        
        # Si aucune sous-catégorie n'est trouvée, essayer de chercher dans les colonnes nommées
        if not subcategories:
            subcategory_column = None
            
            # Rechercher une colonne qui pourrait contenir des sous-catégories
            potential_subcategory_columns = [
                'Sous-catégorie', 'Sous-Catégorie', 'Sous catégorie', 'Sous-cat', 'Subcategory', 
                'Sub-category', 'Subcategorie', 'Sous-categorie', 'Category', 'Catégorie'
            ]
            
            # Vérifier si l'une des colonnes potentielles existe dans le DataFrame
            for col_name in potential_subcategory_columns:
                if col_name in df.columns:
                    subcategory_column = col_name
                    logger.info(f"Colonne de sous-catégorie trouvée: {subcategory_column}")
                    break
            
            # Si aucune colonne standard n'est trouvée, chercher par mots-clés dans les noms de colonnes
            if not subcategory_column:
                for col in df.columns:
                    if any(keyword in str(col).lower() for keyword in ['catégorie', 'categorie', 'category', 'subcat']):
                        subcategory_column = col
                        logger.info(f"Colonne de sous-catégorie trouvée par mot-clé: {subcategory_column}")
                        break
            
            # Extraire les sous-catégories si une colonne a été trouvée
            if subcategory_column:
                subcategories = df[subcategory_column].dropna().unique().tolist()
                logger.info(f"Sous-catégories trouvées dans la colonne '{subcategory_column}': {subcategories}")
        
        # Si toujours aucune sous-catégorie n'est trouvée, créer une sous-catégorie par défaut
        if not subcategories:
            subcategories = ["Non catégorisé"]
            logger.info("Aucune sous-catégorie trouvée, utilisation de 'Non catégorisé' par défaut")
        
        # Extraire les données pertinentes
        extracted_data = []
        
        # Déterminer les colonnes importantes
        # Pour le format spécifique où la première colonne est la sous-catégorie et les autres colonnes sont les mois
        if len(df.columns) > 1 and subcategories and subcategories[0] in df.iloc[:, 0].values:
            logger.info("Format détecté: première colonne = sous-catégories, autres colonnes = mois")
            
            # Parcourir chaque ligne (sous-catégorie)
            for idx, row in df.iterrows():
                subcategory = str(row.iloc[0])
                
                # Ignorer les lignes vides ou les en-têtes
                if pd.isna(subcategory) or subcategory.lower() in ['sous-catégorie', 'subcategory', 'catégorie', 'category']:
                    continue
                
                # Parcourir chaque colonne (mois) à partir de la deuxième colonne
                for col_idx in range(1, len(df.columns)):
                    month_col = df.columns[col_idx]
                    amount = row.iloc[col_idx]
                    
                    # Convertir en nombre si possible
                    try:
                        # S'assurer que la valeur est un nombre
                        if isinstance(amount, str):
                            # Remplacer les virgules par des points pour la conversion
                            amount = amount.replace(',', '.')
                        amount = float(amount)
                        
                        # Vérifier si le montant est valide
                        if pd.isna(amount) or amount == '':
                            continue
                    except (ValueError, TypeError):
                        logger.warning(f"Impossible de convertir la valeur '{amount}' en nombre pour {subcategory}, mois {month_col}")
                        continue
                    
                    # Déterminer le mois et l'année
                    month_name = str(month_col)
                    month_mapping = {
                        'janv': '01', 'jan': '01', 'janvier': '01',
                        'févr': '02', 'fév': '02', 'février': '02', 'feb': '02',
                        'mars': '03', 'mar': '03',
                        'avr': '04', 'avril': '04', 'apr': '04',
                        'mai': '05', 'may': '05',
                        'juin': '06', 'jun': '06',
                        'juil': '07', 'juillet': '07', 'jul': '07',
                        'août': '08', 'aout': '08', 'aug': '08',
                        'sept': '09', 'sep': '09', 'septembre': '09',
                        'oct': '10', 'octobre': '10',
                        'nov': '11', 'novembre': '11',
                        'déc': '12', 'dec': '12', 'décembre': '12'
                    }
                    
                    month_num = None
                    for key, value in month_mapping.items():
                        if key in month_name.lower():
                            month_num = value
                            break
                    
                    # Si le mois n'est pas reconnu, essayer de l'extraire directement
                    if not month_num and month_name.isdigit() and 1 <= int(month_name) <= 12:
                        month_num = str(int(month_name)).zfill(2)
                    
                    if not month_num:
                        logger.warning(f"Mois non reconnu: {month_name}")
                        month_num = '01'  # Valeur par défaut
                    
                    # Créer une date avec l'année fournie et le mois détecté
                    date_str = f"{year}-{month_num}-01" if year else f"2023-{month_num}-01"
                    
                    # Déterminer si c'est un revenu ou une dépense (par défaut, considérer comme dépense)
                    is_income = False
                    
                    # Créer un objet pour chaque transaction
                    transaction = {
                        "description": f"{subcategory} - {month_name}",
                        "amount": abs(float(amount)),
                        "is_income": is_income,
                        "date": date_str,
                        "subcategory": subcategory
                    }
                    
                    # Log pour débogage
                    logger.info(f"Transaction extraite: {subcategory} - {month_name}: {abs(float(amount))} €")
                    
                    extracted_data.append(transaction)
        else:
            # Format standard avec colonnes nommées
            amount_column = None
            date_column = None
            description_column = None
            subcategory_column = None
            
            # Rechercher la colonne de montant
            amount_keywords = ['montant', 'amount', 'somme', 'valeur', 'value', 'prix', 'price']
            for col in df.columns:
                if any(keyword in str(col).lower() for keyword in amount_keywords):
                    amount_column = col
                    logger.info(f"Colonne de montant trouvée: {amount_column}")
                    break
            
            # Rechercher la colonne de date
            date_keywords = ['date', 'jour', 'day']
            for col in df.columns:
                if any(keyword in str(col).lower() for keyword in date_keywords):
                    date_column = col
                    logger.info(f"Colonne de date trouvée: {date_column}")
                    break
            
            # Rechercher la colonne de description
            description_keywords = ['description', 'libellé', 'libelle', 'desc', 'label', 'titre', 'title']
            for col in df.columns:
                if any(keyword in str(col).lower() for keyword in description_keywords):
                    description_column = col
                    logger.info(f"Colonne de description trouvée: {description_column}")
                    break
            
            # Rechercher la colonne de sous-catégorie
            subcategory_keywords = ['sous-catégorie', 'sous catégorie', 'subcategory', 'catégorie', 'category']
            for col in df.columns:
                if any(keyword in str(col).lower() for keyword in subcategory_keywords):
                    subcategory_column = col
                    logger.info(f"Colonne de sous-catégorie trouvée: {subcategory_column}")
                    break
            
            # Parcourir les lignes du DataFrame
            for _, row in df.iterrows():
                # Extraire les valeurs avec gestion des valeurs manquantes
                amount = 0
                if amount_column and pd.notna(row.get(amount_column)):
                    try:
                        # S'assurer que la valeur est un nombre
                        if isinstance(row.get(amount_column), str):
                            # Remplacer les virgules par des points pour la conversion
                            amount = row.get(amount_column).replace(',', '.')
                        amount = float(amount)
                    except (ValueError, TypeError):
                        logger.warning(f"Impossible de convertir la valeur '{row.get(amount_column)}' en nombre")
                        continue
                
                date_str = None
                if date_column and pd.notna(row.get(date_column)):
                    try:
                        date_value = row.get(date_column)
                        if isinstance(date_value, str):
                            # Essayer de parser la date si c'est une chaîne
                            date_value = pd.to_datetime(date_value)
                        date_str = date_value.strftime('%Y-%m-%d')
                    except Exception as e:
                        logger.warning(f"Erreur lors du formatage de la date: {e}")
                        # Utiliser une date par défaut
                        date_str = f"{year}-01-01" if year else "2023-01-01"
                else:
                    # Utiliser une date par défaut
                    date_str = f"{year}-01-01" if year else "2023-01-01"
                
                description = ""
                if description_column and pd.notna(row.get(description_column)):
                    description = str(row.get(description_column))
                
                subcategory = "Non catégorisé"
                if subcategory_column and pd.notna(row.get(subcategory_column)):
                    subcategory = str(row.get(subcategory_column))
                
                # Déterminer si c'est un revenu ou une dépense
                is_income = amount > 0
                
                # Créer un objet pour chaque transaction
                transaction = {
                    "description": description,
                    "amount": abs(float(amount)),
                    "is_income": is_income,
                    "date": date_str,
                    "subcategory": subcategory
                }
                
                # Log pour débogage
                logger.info(f"Transaction extraite: {subcategory} - {date_str}: {abs(float(amount))} €")
                
                extracted_data.append(transaction)
        
        logger.info(f"Nombre de transactions extraites: {len(extracted_data)}")
        logger.info(f"Sous-catégories finales: {subcategories}")
        
        # Sauvegarder les données extraites dans un fichier temporaire
        base_name = os.path.splitext(os.path.basename(file.filename))[0]
        year_suffix = f"_{year}" if year else ""
        temp_file = os.path.join(temp_dir, f"{base_name}{year_suffix}_extracted.json")
        
        with open(temp_file, 'w') as f:
            json.dump(extracted_data, f)
        
        logger.info(f"Données extraites sauvegardées: {temp_file}")
        
        # Supprimer le fichier Excel temporaire
        os.remove(file_path)
        
        return {
            "status": "success",
            "message": f"Fichier importé avec succès. {len(extracted_data)} transactions extraites.",
            "subcategories": subcategories,
            "fileName": file.filename,
            "columns": columns,
            "data": raw_data,  # Inclure les données brutes pour le frontend
            "transactionsCount": len(extracted_data)
        }
        
    except Exception as e:
        logger.exception(f"Erreur lors de l'importation du fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'importation du fichier: {str(e)}") 