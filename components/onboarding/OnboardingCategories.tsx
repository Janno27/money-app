import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingCategoriesProps {
  theme: 'light' | 'dark';
  setLoading: (loading: boolean) => void;
}

export function OnboardingCategories({ theme, setLoading }: OnboardingCategoriesProps) {
  const [isReady, setIsReady] = useState(false);
  const supabase = createClientComponentClient();

  // Vérifier si des catégories existent déjà
  useEffect(() => {
    const checkCategories = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id')
          .limit(1);

        if (error) {
          console.error("Erreur lors de la vérification des catégories:", error);
          return;
        }

        // Si des catégories existent, l'étape est prête
        setIsReady(data && data.length > 0);
      } catch (error) {
        console.error("Erreur lors de la vérification des catégories:", error);
      } finally {
        setLoading(false);
      }
    };

    checkCategories();
  }, [supabase, setLoading]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className={cn(
        "w-full max-w-lg mx-auto p-6 rounded-lg shadow-md text-center",
        theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
      )}>
        <h2 className="text-2xl font-semibold mb-6">Configuration des Catégories</h2>
        
        {isReady ? (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-lg">
              Les catégories et sous-catégories sont déjà configurées.
            </p>
            <p className={cn(
              "text-sm mt-2",
              theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
            )}>
              Vous pouvez continuer vers l'étape suivante.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
            <p className="text-lg">
              Configuration des catégories en cours...
            </p>
            <p className={cn(
              "text-sm mt-2",
              theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
            )}>
              Veuillez patienter pendant que nous préparons votre compte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 