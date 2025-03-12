import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Récupérer les variables d'environnement pour Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

# Vérifier que les variables d'environnement sont définies
if not supabase_url or not supabase_key:
    print("ERREUR CRITIQUE: Variables d'environnement Supabase manquantes!")
    print(f"SUPABASE_URL: {'Défini' if supabase_url else 'MANQUANT'}")
    print(f"SUPABASE_ANON_KEY: {'Défini' if supabase_key else 'MANQUANT'}")
    # Ne pas lever d'exception ici pour permettre à l'application de démarrer
    # mais le client sera None
    supabase = None
else:
    try:
        # Créer le client Supabase
        print(f"Initialisation du client Supabase avec URL: {supabase_url[:20]}...")
        supabase = create_client(supabase_url, supabase_key)
        print("Client Supabase initialisé avec succès")
    except Exception as e:
        print(f"ERREUR lors de l'initialisation du client Supabase: {e}")
        supabase = None

def get_supabase_client() -> Client:
    """
    Fonction pour récupérer le client Supabase
    """
    if supabase is None:
        raise ValueError("Client Supabase non initialisé. Vérifiez les variables d'environnement.")
    return supabase 