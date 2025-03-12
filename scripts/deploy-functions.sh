#!/bin/bash

# S'assurer que l'on est bien à la racine du projet
cd "$(dirname "$0")/.."

# Vérifier que le CLI Supabase est installé
if ! command -v supabase &> /dev/null; then
    echo "Le CLI Supabase n'est pas installé. Veuillez l'installer : https://supabase.com/docs/guides/cli"
    exit 1
fi

# Variables
PROJECT_ID=$(grep -o 'NEXT_PUBLIC_SUPABASE_URL=.*' .env.local | sed 's/.*https:\/\/\(.*\)\.supabase\.co.*/\1/')

if [ -z "$PROJECT_ID" ]; then
    echo "Impossible de trouver l'ID du projet Supabase dans le fichier .env.local"
    echo "Veuillez entrer manuellement l'ID du projet Supabase (par exemple 'ouiwpkxvjxcfbypmurap'):"
    read PROJECT_ID
fi

# Créer les répertoires nécessaires s'ils n'existent pas
mkdir -p supabase/functions/_shared

# Vérifier si les fichiers de base existent
if [ ! -f "supabase/functions/_shared/cors.ts" ]; then
    echo "Création du fichier cors.ts..."
    cat > supabase/functions/_shared/cors.ts << 'EOF'
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}
EOF
fi

# Déployer toutes les fonctions dans le répertoire functions
echo "Déploiement des fonctions Edge Supabase..."
cd supabase
supabase functions deploy --project-ref "$PROJECT_ID"

# Vérifier si le déploiement a réussi
if [ $? -eq 0 ]; then
    echo "🎉 Déploiement réussi!"
    echo "Vos fonctions Edge sont maintenant disponibles à l'adresse:"
    echo "https://$PROJECT_ID.supabase.co/functions/v1/"
else
    echo "❌ Erreur lors du déploiement."
    echo "Vérifiez que vous êtes connecté au CLI Supabase (supabase login) et que le projet existe."
fi

# Retourner à la racine du projet
cd ..

# Afficher des instructions pour l'utilisation
echo ""
echo "Pour tester les fonctions localement:"
echo "supabase functions serve --env-file .env.local"
echo ""
echo "URL de la fonction invite-user en environnement local:"
echo "http://localhost:54321/functions/v1/invite-user" 