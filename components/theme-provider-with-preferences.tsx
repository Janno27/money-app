"use client"

import { ThemeProvider } from "@/components/ui/theme-provider"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect, ReactNode } from 'react'

interface ThemeProviderWithPreferencesProps {
  children: ReactNode;
}

export function ThemeProviderWithPreferences({ children }: ThemeProviderWithPreferencesProps) {
  const [defaultTheme, setDefaultTheme] = useState<string>("dark"); // Par défaut dark
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Fonction pour récupérer le thème de l'utilisateur
    const getUserTheme = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log("Utilisateur non connecté, utilisation du thème par défaut");
          return;
        }
        
        // Récupérer les préférences de l'utilisateur
        const { data: preferences, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();
          
        if (preferencesError || !preferences) {
          console.log("Pas de préférences trouvées, utilisation du thème par défaut");
          return;
        }
        
        // Définir le thème de l'application
        if (preferences.theme === 'light' || preferences.theme === 'dark') {
          console.log(`Thème récupéré depuis les préférences: ${preferences.theme}`);
          setDefaultTheme(preferences.theme);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du thème:", error);
      }
    };
    
    getUserTheme();
  }, [supabase]);

  return (
    <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
      {children}
    </ThemeProvider>
  );
} 