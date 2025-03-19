import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Initialiser le client Supabase
  const supabase = createServerSupabaseClient({ req, res });

  // Vérifier l'authentification
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    // Récupérer les données du corps de la requête
    const { year, fileName } = req.body;

    if (!year) {
      return res.status(400).json({ error: 'Année manquante' });
    }

    // URL de l'API backend
    const backendUrl = process.env.NEXT_PUBLIC_FORECAST_API_URL || 'http://localhost:8000';
    
    // Envoyer la requête au service backend Python
    const response = await axios.post(`${backendUrl}/api/complete-import`, {
      year,
      fileName,
      user_id: session.user.id
    });

    // Traiter la réponse
    if (response.data && response.status === 200) {
      return res.status(200).json({
        success: true,
        message: 'Importation finalisée avec succès',
        transactionsCount: response.data.transactions_count
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la finalisation de l\'importation',
        error: response.data.detail || 'Erreur inconnue'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'importation:', error);
    
    // Gérer les erreurs axios
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.detail || error.message;
      
      return res.status(statusCode).json({
        success: false,
        message: 'Erreur lors de la communication avec le backend',
        error: errorMessage
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la finalisation de l\'importation',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
} 