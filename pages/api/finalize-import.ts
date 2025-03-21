import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import axios from 'axios';

// Ajouter une structure pour stocker les données importées
interface ImportedData {
  categories: {
    [categoryName: string]: {
      subcategories: {
        [subcategoryName: string]: {
          [month: string]: number
        }
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Initialiser le client Supabase
    const supabase = createServerSupabaseClient({ req, res });
    
    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer les données du corps de la requête
    const { mappings, year, fileName } = req.body;

    if (!mappings || !year) {
      return res.status(400).json({ error: 'Mappings ou année manquant' });
    }

    // Envoyer la requête au backend Python
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_FORECAST_API_URL || 'http://localhost:8000';
    console.log(`Envoi au backend: ${backendUrl}/api/finalize-import`);
    console.log('Données envoyées:', JSON.stringify({
      mappings,
      year,
      fileName,
      user_id: session.user.id
    }, null, 2));
    
    try {
      const response = await axios.post(`${backendUrl}/api/finalize-import`, {
        mappings,
        year,
        fileName,
        user_id: session.user.id
      });

      // Renvoyer la réponse du backend
      const data = response.data;
      console.log('Réponse du backend:', JSON.stringify(data, null, 2));
      
      // Créer une structure pour stocker les données importées
      const importedData: ImportedData = {
        categories: {}
      };
      
      // Traiter les données pour l'aperçu
      if (data && data.length > 0) {
        data.forEach((transaction: any) => {
          const categoryName = transaction.category_name || 'Non catégorisé';
          const subcategoryName = transaction.subcategory_name || 'Non catégorisé';
          const amount = Math.abs(transaction.amount);
          const date = new Date(transaction.date);
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Format "01", "02", etc.
          
          // Initialiser la catégorie si elle n'existe pas
          if (!importedData.categories[categoryName]) {
            importedData.categories[categoryName] = {
              subcategories: {}
            };
          }
          
          // Initialiser la sous-catégorie si elle n'existe pas
          if (!importedData.categories[categoryName].subcategories[subcategoryName]) {
            importedData.categories[categoryName].subcategories[subcategoryName] = {};
          }
          
          // Ajouter ou mettre à jour le montant pour le mois
          const currentAmount = importedData.categories[categoryName].subcategories[subcategoryName][month] || 0;
          importedData.categories[categoryName].subcategories[subcategoryName][month] = currentAmount + amount;
        });
      }
      
      // Renvoyer une réponse de succès avec les données importées
      return res.status(200).json({
        status: 'success',
        message: `Validation réussie. ${data.length} transactions prêtes à être importées.`,
        importedData,
        transactionsCount: data.length
      });
    } catch (axiosError: unknown) {
      const error = axiosError as Error & { 
        response?: { data: any, status: number, headers: any }, 
        request?: any 
      };
      console.error('Erreur axios:', error.message);
      if (error.response) {
        console.error('Détails de la réponse:', error.response.data);
        console.error('Status code:', error.response.status);
        console.error('Headers:', error.response.headers);
        return res.status(error.response.status).json({ 
          error: `Erreur du serveur backend: ${JSON.stringify(error.response.data)}`
        });
      } else if (error.request) {
        console.error('Pas de réponse reçue:', error.request);
        return res.status(503).json({ error: 'Le serveur backend est inaccessible' });
      } else {
        return res.status(500).json({ error: `Erreur de requête: ${error.message}` });
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Erreur lors de la finalisation de l\'importation:', err);
    return res.status(500).json({ error: `Erreur lors de la validation de l'importation: ${err.message}` });
  }
} 