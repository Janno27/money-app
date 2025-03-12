import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import database_exists, create_database

# Charger les variables d'environnement
load_dotenv()

# Récupérer l'URL de la base de données depuis les variables d'environnement
DATABASE_URL = os.getenv("DATABASE_URL")

# Créer le moteur SQLAlchemy
engine = create_engine(DATABASE_URL)

# Vérifier si la base de données existe, sinon la créer
if not database_exists(engine.url):
    create_database(engine.url)

# Créer une session pour interagir avec la base de données
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Script SQL pour créer la table des événements récurrents
recurring_events_table_sql = """
CREATE TABLE IF NOT EXISTS recurring_events (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    is_income BOOLEAN NOT NULL DEFAULT FALSE,
    category_id UUID NOT NULL,
    subcategory_id UUID,
    frequency VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT recurring_events_pkey PRIMARY KEY (id),
    CONSTRAINT recurring_events_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT recurring_events_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories (id),
    CONSTRAINT recurring_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_recurring_events_dates ON recurring_events USING btree (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_recurring_events_category ON recurring_events USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_user ON recurring_events USING btree (user_id);
"""

def init_db():
    """Initialise la base de données avec les tables nécessaires."""
    try:
        db = SessionLocal()
        # Exécuter le script SQL pour créer la table des événements récurrents
        db.execute(text(recurring_events_table_sql))
        db.commit()
        print("Table 'recurring_events' créée avec succès.")
    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 