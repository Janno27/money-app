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

# Appliquer les migrations
echo "Application des migrations Supabase..."

# Vérifier si le projet est lié à Supabase
if supabase status --output=json | grep -q "\"REMOTE_PROJECT_ID\":\"$PROJECT_ID\""; then
    echo "Projet déjà lié à Supabase."
else
    echo "Liaison du projet à Supabase..."
    supabase link --project-ref "$PROJECT_ID"
fi

# Pousser les migrations
cd supabase
supabase db push

# Vérifier si l'application des migrations a réussi
if [ $? -eq 0 ]; then
    echo "🎉 Migrations appliquées avec succès!"
else
    echo "❌ Erreur lors de l'application des migrations."
    echo "Vérifiez que vous êtes connecté au CLI Supabase (supabase login) et que le projet existe."
fi

# Retourner à la racine du projet
cd ..

# Informations complémentaires
echo ""
echo "Votre base de données a été mise à jour."
echo "Pour revoir le schéma de votre base de données, visitez :"
echo "https://supabase.com/dashboard/project/$PROJECT_ID/database/tables" 