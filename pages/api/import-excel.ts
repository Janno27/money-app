import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';

// Désactiver le body parser par défaut pour les requêtes multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Analyser le formulaire multipart
    const form = formidable({});
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Récupérer le fichier et l'année
    const fileField = files.file;
    const yearField = fields.year;
    
    // Vérifier et extraire le fichier et l'année
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    const year = Array.isArray(yearField) ? yearField[0] : yearField;

    if (!file || !year) {
      return res.status(400).json({ error: 'Fichier ou année manquant' });
    }

    // Créer un FormData pour envoyer au backend Python
    const formData = new FormData();
    formData.append('file', new Blob([fs.readFileSync(file.filepath)]), file.originalFilename || 'file.xlsx');
    formData.append('year', year);

    // Utiliser l'URL API de forecast comme fallback pour le backend
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_FORECAST_API_URL || 'http://localhost:8000';
    console.log(`Envoi au backend: ${backendUrl}/api/import-excel`);
    
    try {
      // Envoyer la requête au backend Python
      const response = await axios.post(`${backendUrl}/api/import-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Nettoyer le fichier temporaire
      fs.unlinkSync(file.filepath);

      // Renvoyer la réponse du backend
      return res.status(200).json(response.data);
    } catch (axiosError: unknown) {
      const error = axiosError as Error & { 
        response?: { data: Record<string, unknown>, status: number, statusText: string }, 
        request?: Record<string, unknown> 
      };
      console.error('Erreur axios:', error.message);
      if (error.response) {
        console.error('Détails de la réponse:', error.response.data);
        return res.status(error.response.status).json({ 
          error: `Erreur du serveur backend: ${(error.response.data as { detail?: string })?.detail || error.response.statusText}` 
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
    console.error('Erreur lors de l\'importation du fichier:', err);
    return res.status(500).json({ error: `Erreur lors de l'importation du fichier: ${err.message}` });
  }
} 