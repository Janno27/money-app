import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Récupérer l'URL de la base de données depuis les variables d'environnement
DATABASE_URL = os.getenv("DATABASE_URL")

# Créer le moteur SQLAlchemy
engine = create_engine(DATABASE_URL)

# Créer une session pour interagir avec la base de données
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Créer une base pour les modèles déclaratifs
Base = declarative_base()

# Fonction pour obtenir une instance de session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 