"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, ReactNode, useRef } from "react"
import { ArrowLeft, Plus, RefreshCcw, BarChart3, Filter, Calendar, CreditCard, X, Sun, Moon, Users, Copy, CheckCircle, ArrowRight, ExternalLink, Database, FileUp, FileX, Twitter, Paperclip, Keyboard, Sparkles, Laptop, Tags, GalleryThumbnails, Atom, Sparkle, ChevronDown, ChevronRight } from "lucide-react"
import { OnboardingTour } from "./OnboardingTour"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { demoDataGenerator } from '@/services/demo-data/demo-data-generator';

interface OnboardingGeneralProps {
  children?: ReactNode;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

// Composant AnimatedTask qui affiche des phrases avec un délai aléatoire
interface AnimatedTaskProps {
  icon: ReactNode;
  title: string;
  phrases: string[];
  theme: 'light' | 'dark';
  onComplete?: () => void;
}

function AnimatedTask({ icon, title, phrases, theme, onComplete }: AnimatedTaskProps) {
  const [visiblePhrases, setVisiblePhrases] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedPhrases, setCompletedPhrases] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Références pour les timers
  const progressTimerRef = useRef<number | null>(null);
  const phraseTimersRef = useRef<NodeJS.Timeout[]>([]);
  const phraseCompletionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Nettoyage avant de réinitialiser
    if (progressTimerRef.current) {
      cancelAnimationFrame(progressTimerRef.current);
    }
    
    phraseTimersRef.current.forEach(timer => clearTimeout(timer));
    phraseTimersRef.current = [];
    
    if (phraseCompletionTimerRef.current) {
      clearTimeout(phraseCompletionTimerRef.current);
    }
    
    // Réinitialiser l'état quand les props changent
    setVisiblePhrases([]);
    setCompletedPhrases([]);
    setIsLoading(true);
    setProgress(0);
    
    // Calculer la durée totale estimée (basée sur les délais entre phrases)
    const baseDuration = 12000; // Durée de base de 12 secondes
    const estimatedTotalDuration = baseDuration + (phrases.length * 500); // Ajout de 500ms par phrase
    
    // Animer la progression avec requestAnimationFrame
    const startTime = Date.now();
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / estimatedTotalDuration, 1);
      setProgress(currentProgress);
      
      if (currentProgress < 1) {
        progressTimerRef.current = requestAnimationFrame(animateProgress);
      } else if (onComplete) {
        // Appeler le callback onComplete lorsque l'animation est terminée
        const timer = setTimeout(() => {
          onComplete();
        }, 500);
        phraseCompletionTimerRef.current = timer;
      }
    };
    
    progressTimerRef.current = requestAnimationFrame(animateProgress);
    
    // Afficher les phrases une par une avec un délai déterministe
    phrases.forEach((_, index) => {
      // Délai plus prévisible 
      const phraseDelay = index === 0 ? 1000 : 3000 + (index * 1200);
      
      const timer = setTimeout(() => {
        setVisiblePhrases(prev => [...prev, index]);
        
        // Marquer la phrase précédente comme complétée
        if (index > 0) {
          setCompletedPhrases(prev => [...prev, index - 1]);
        }
        
        // Marquer la dernière phrase comme complétée après un délai
        if (index === phrases.length - 1) {
          const completionTimer = setTimeout(() => {
            setCompletedPhrases(prev => [...prev, index]);
            setIsLoading(false);
          }, 1500);
          phraseCompletionTimerRef.current = completionTimer;
        }
      }, phraseDelay);
      
      phraseTimersRef.current.push(timer);
    });
    
    // Cleanup à la désallocation du composant
    return () => {
      if (progressTimerRef.current) {
        cancelAnimationFrame(progressTimerRef.current);
      }
      
      phraseTimersRef.current.forEach(timer => clearTimeout(timer));
      
      if (phraseCompletionTimerRef.current) {
        clearTimeout(phraseCompletionTimerRef.current);
      }
    };
  }, [phrases, onComplete]);
  
  // Fonction pour formatter les phrases avec du code
  const formatPhrase = (phrase: string) => {
    // Détecter les parties de code (entre backticks)
    const codeRegex = /`([^`]+)`/g;
    const parts = phrase.split(codeRegex);
    
    return (
      <div className="flex flex-wrap items-center">
        {parts.map((part, i) => {
          // Les indices pairs sont du texte normal, les indices impairs sont du code
          if (i % 2 === 0) {
            return <span key={i}>{part}</span>;
          } else {
            return (
              <code key={i} className={cn(
                "inline-flex px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono",
                theme === 'dark' 
                  ? "bg-slate-700 text-blue-300" 
                  : "bg-slate-100 text-blue-600"
              )}>
                {part}
              </code>
            );
          }
        })}
      </div>
    );
  };
  
  return (
    <div className="my-6 flex flex-col items-center w-full">
      <div 
        className={cn(
          "relative w-full max-w-[550px] p-8 rounded-xl",
          "border border-transparent overflow-hidden",
          "bg-white"
        )}
        style={{
          backgroundClip: 'padding-box',
          boxShadow: '0 0 0 1px transparent'
        }}
      >
        {/* Bordure de progression */}
        <div 
          className="absolute inset-0 rounded-xl z-0" 
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, #3b82f6 0%, #3b82f6 ${progress * 100}%, transparent ${progress * 100}%, transparent 100%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px'
          }}
        />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-12 h-12 mb-5">
            <div className={cn(
              "absolute inset-0 rounded-full",
              isLoading ? "animate-pulse" : "",
              "bg-blue-100"
            )}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "h-6 w-6",
                "text-purple-500"
              )}>
                {icon}
              </div>
            </div>
          </div>
          
          <p className={cn(
            "text-lg font-medium mb-3",
            "text-slate-600"
          )}>
            {title}
          </p>
          
          <div className={cn(
            "text-xs max-w-xs space-y-4 w-full",
            "text-slate-500"
          )}>
            {phrases.map((phrase, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-start transition-all duration-500",
                  visiblePhrases.includes(index) 
                    ? "opacity-100 transform translate-y-0" 
                    : "opacity-0 transform -translate-y-2"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-0.5"
                )}>
                  {visiblePhrases.includes(index) && completedPhrases.includes(index) ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : visiblePhrases.includes(index) ? (
                    <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-slate-200"></div>
                  )}
                </div>
                <div className="italic text-left max-w-[480px] break-words">
                  {formatPhrase(phrase)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SecondGroupProps {
  show: boolean;
  theme: 'light' | 'dark';
  onComplete?: () => void;
}

function SecondGroup({ show, theme, onComplete }: SecondGroupProps) {
  useEffect(() => {
    if (show) {
      // Démarrer les animations du second groupe
      const timer = setTimeout(() => {
        // Appeler onComplete à la fin de la séquence d'animation (environ 12-15 secondes)
        if (onComplete) {
          const completeTimer = setTimeout(() => {
            onComplete();
          }, 12000);
          return () => clearTimeout(completeTimer);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 transition-transform duration-500" style={{ 
      transform: `translateX(${show ? '0' : '100%'})` 
    }}>
      <AnimatedTask 
        icon={
          <div className="relative">
            <Sparkles className={cn(
              "h-full w-full",
              theme === 'dark' ? "text-cyan-400" : "text-cyan-500"
            )} />
            <div className={cn(
              "absolute inset-0 animate-pulse rounded-full",
              theme === 'dark' ? "bg-cyan-900/30" : "bg-cyan-100/70"
            )} style={{ 
              animationDuration: '3s' 
            }} />
          </div>
        }
        title="Prévisions en cours"
        phrases={[
          "Training du modèle… `model.fit(data);` et croisons les doigts.",
          "Calcul des projections… `if (revenus > dépenses) console.log('Chill!');` ou panique.",
          "Chargement des graphiques… `import matplotlib as plt;` ou Google Images."
        ]}
        theme={theme}
      />
    </div>
  );
}

interface ThirdGroupProps {
  show: boolean;
  theme: 'light' | 'dark';
  onComplete?: () => void;
}

function ThirdGroup({ show, theme, onComplete }: ThirdGroupProps) {  
  useEffect(() => {
    if (show) {
      // Démarrer les animations du troisième groupe
      const timer = setTimeout(() => {
        // Appeler onComplete à la fin de la séquence d'animation
        if (onComplete) {
          const completeTimer = setTimeout(() => {
            onComplete();
          }, 12000); // Durée approximative de l'animation complète
          return () => clearTimeout(completeTimer);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 transition-transform duration-500" style={{ 
      transform: `translateX(${show ? '0' : '100%'})` 
    }}>
      <AnimatedTask 
        icon={
          <div className="relative">
            <Atom className={cn(
              "h-full w-full",
              theme === 'dark' ? "text-indigo-400" : "text-indigo-500"
            )} />
            <div className={cn(
              "absolute inset-0 animate-pulse rounded-full",
              theme === 'dark' ? "bg-indigo-900/30" : "bg-indigo-100/70"
            )} style={{ 
              animationDuration: '3s' 
            }} />
          </div>
        }
        title="Personnalisation en cours"
        phrases={[
          "Construction des composants… `class App extends React.Component { render() { magic(); } };`",
          "Compilation du style… `npm run build;` et priez pour que ça marche.",
          "Déploiement de votre cockpit financier… `git push origin main;` et espérons que GitHub ne soit pas down."
        ]}
        theme={theme}
      />
    </div>
  );
}

interface FinalRevealProps {
  show: boolean;
  theme: 'light' | 'dark';
  onComplete: () => void;
}

function FinalReveal({ show, theme, onComplete }: FinalRevealProps) {
  const [textOpacity, setTextOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [fireworks, setFireworks] = useState<{ id: number; x: number; y: number; size: number; color: string }[]>([]);
  const [showButtons, setShowButtons] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  // Log la valeur du thème pour débogage
  console.log("FinalReveal received theme:", theme);
  
  // S'assurer que le thème est correctement récupéré depuis localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('user-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setCurrentTheme(savedTheme as 'light' | 'dark');
      console.log("FinalReveal updated theme from localStorage:", savedTheme);
    }
    
    // Écouter les changements de thème
    const handleThemeChange = (e: CustomEvent<{ theme: 'light' | 'dark' }>) => {
      if (e.detail && (e.detail.theme === 'light' || e.detail.theme === 'dark')) {
        console.log("FinalReveal detected theme change:", e.detail.theme);
        setCurrentTheme(e.detail.theme);
      }
    };
    
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
    };
  }, []);
  
  useEffect(() => {
    if (!show) return;
    
    // Animation d'apparition du texte
    const textTimer = setTimeout(() => {
      // log encore une fois dans le timer
      console.log("FinalReveal theme in effect:", currentTheme);
      
      setTextOpacity(1);
      setScale(1);
      
      // Créer les feux d'artifice avec des couleurs adaptées au thème
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          // Couleurs différentes selon le thème
          const darkThemeColors = ['#8b5cf6', '#60a5fa', '#34d399', '#a78bfa', '#f472b6'];
          const lightThemeColors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];
          
          const colors = currentTheme === 'dark' ? darkThemeColors : lightThemeColors;
          
          setFireworks(prev => [
            ...prev, 
            {
              id: Date.now() + i,
              x: Math.random() * 100,
              y: Math.random() * 100,
              size: Math.random() * 2 + 1,
              color: colors[Math.floor(Math.random() * colors.length)]
            }
          ]);
        }, i * 200);
      }

      // Afficher les boutons après 2 secondes
      setTimeout(() => {
        setShowButtons(true);
      }, 2000);
      
      // Passer à l'étape suivante automatiquement après un délai plus long
      const nextStepTimer = setTimeout(() => {
        onComplete();
      }, 30000); // 30 secondes de délai avant passage automatique
      
      return () => clearTimeout(nextStepTimer);
    }, 500);
    
    return () => clearTimeout(textTimer);
  }, [show, onComplete, currentTheme]);
  
  if (!show) return null;
  
  // Utiliser currentTheme au lieu de theme dans tous les renderus
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden z-50">
      {/* Fond avec dégradé */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          currentTheme === 'dark' 
            ? "bg-gradient-to-tl from-slate-900 via-indigo-950 to-purple-950" 
            : "bg-gradient-to-tl from-white via-blue-50 to-indigo-100"
        )} 
      />
      
      {/* Particules brillantes en arrière-plan (thème sombre uniquement) */}
      {currentTheme === 'dark' && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={`star-${i}`} 
              className="absolute rounded-full animate-pulse bg-indigo-300/10"
              style={{
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Effets de feux d'artifice */}
      {fireworks.map((fw) => (
        <div
          key={fw.id}
          className="absolute animate-firework"
          style={{
            left: `${fw.x}%`,
            top: `${fw.y}%`,
            width: `${fw.size}rem`,
            height: `${fw.size}rem`
          }}
        >
          <div 
            className={cn(
              "absolute inset-0 rounded-full animate-ping",
              currentTheme === 'dark' ? "opacity-90" : "opacity-70"
            )}
            style={{ 
              backgroundColor: fw.color,
              boxShadow: currentTheme === 'dark' ? `0 0 15px ${fw.color}` : 'none'
            }}
          />
          <Sparkle 
            className="absolute" 
            style={{ 
              color: fw.color, 
              transform: 'translate(-50%, -50%)', 
              width: `${fw.size * 1.5}rem`, 
              height: `${fw.size * 1.5}rem`,
              filter: currentTheme === 'dark' ? 'drop-shadow(0 0 8px currentColor)' : 'none'
            }} 
          />
        </div>
      ))}
      
      {/* Message principal et boutons */}
      <div className="flex flex-col items-center justify-center z-10">
        <div 
          className={cn(
            "text-center z-10 transform transition-all duration-1000 ease-out mb-12",
            currentTheme === 'dark' ? "text-white" : "text-slate-800"
          )}
          style={{
            opacity: textOpacity,
            transform: `scale(${scale})`,
            textShadow: currentTheme === 'dark' 
              ? '0 0 30px rgba(124, 58, 237, 0.7), 0 0 15px rgba(99, 102, 241, 0.5)' 
              : 'none'
          }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6" style={{ 
            fontFamily: "'Inter', sans-serif", 
            letterSpacing: '-0.03em',
            background: currentTheme === 'dark' 
              ? 'linear-gradient(to right, #c4b5fd, #ffffff)' 
              : 'none',
            WebkitBackgroundClip: currentTheme === 'dark' ? 'text' : 'none',
            WebkitTextFillColor: currentTheme === 'dark' ? 'transparent' : 'inherit',
          }}>
            Votre Application est Prête
          </h1>
          <p className={cn(
            "text-xl md:text-2xl mt-6",
            currentTheme === 'dark' ? "text-indigo-200" : "text-blue-600"
          )}>
            Démarrez votre voyage financier maintenant
          </p>
        </div>
        
        {/* Boutons d'action avec animation améliorée */}
        <div 
          className="flex flex-col items-center mt-8 transition-all duration-1000 ease-out" 
          style={{ 
            opacity: showButtons ? 1 : 0,
            transform: showButtons ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'opacity 1s ease-out, transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <Link 
            href="/dashboard"
            className={cn(
              "flex items-center justify-center min-w-[200px] h-[48px] rounded-md font-medium text-base",
              currentTheme === 'dark' 
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-900/20 text-white" 
                : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white"
            )}
          >
            Commencer
          </Link>
          
          <button
            onClick={onComplete}
            className={cn(
              "text-sm opacity-60 hover:opacity-100 transition-opacity mt-4",
              currentTheme === 'dark' ? "text-indigo-300" : "text-slate-500"
            )}
          >
            Découvrir les fonctionnalités
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingGeneral({ children }: OnboardingGeneralProps) {
  const [organization, setOrganization] = useState<{ id: string; name: string }>({ id: '', name: 'Votre foyer' });
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayInviteForm, setDisplayInviteForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [invitedMemberIndex, setInvitedMemberIndex] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [firstGroupComplete, setFirstGroupComplete] = useState(false);
  const [secondGroupComplete, setSecondGroupComplete] = useState(false);
  const [thirdGroupComplete, setThirdGroupComplete] = useState(false);
  const [showFirstGroup, setShowFirstGroup] = useState(true);
  const [initOption, setInitOption] = useState<'fromScratch' | 'demo' | 'import'>('fromScratch');
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Récupérer le thème sélectionné par l'utilisateur
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // Essayer de récupérer depuis localStorage d'abord
      const savedTheme = localStorage.getItem('user-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      
      // Si pas de préférence sauvegardée, vérifier les préférences du système
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light'; // Valeur par défaut
  });
  
  // Hook pour récupérer et maintenir le thème à jour
  useEffect(() => {
    // Fonction pour mettre à jour le thème
    const handleThemeChange = (e: CustomEvent<{ theme: 'light' | 'dark' }>) => {
      if (e.detail && (e.detail.theme === 'light' || e.detail.theme === 'dark')) {
        console.log("Theme change detected:", e.detail.theme);
        setTheme(e.detail.theme);
      }
    };
    
    // Ajouter l'écouteur d'événement
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    
    // Récupérer le thème initial
    const savedTheme = localStorage.getItem('user-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme as 'light' | 'dark');
    }
    
    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
    };
  }, []);
  
  // Log le thème actuel pour le débogage
  console.log("Current theme in OnboardingGeneral (main):", theme);
  
  const supabase = createClientComponentClient();
  
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        setCurrentUserId(session.user.id);

        // 1. Récupérer l'utilisateur actuel et son organisation
        const { data: currentUser } = await supabase
          .from('users')
          .select('id, name, email, avatar, organization_id')
          .eq('id', session.user.id)
          .single();

        if (!currentUser?.organization_id) return;

        // 2. Récupérer les détails de l'organisation
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', currentUser.organization_id)
          .single();

        if (orgData) {
          setOrganization(orgData);

          // 3. Récupérer tous les utilisateurs appartenant à cette organisation
          const { data: orgUsers } = await supabase
            .from('users')
            .select('id, name, email, avatar')
            .eq('organization_id', orgData.id);

          if (orgUsers && orgUsers.length > 0) {
            // Transformer les données pour avoir le format souhaité
            const formattedMembers: Member[] = orgUsers.map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              role: user.id === session.user.id ? 'owner' : 'member'
            }));
            
            setMembers(formattedMembers);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      }
    };

    fetchOrganizationData();
  }, [supabase]);

  const handleInviteMember = async () => {
    if (!newMemberEmail || !isValidEmail(newMemberEmail)) {
      return;
    }

    setIsInviting(true);

    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) throw new Error("Vous devez être connecté");

      // Ajouter temporairement l'utilisateur à la liste avec statut "En attente"
      const tempMember: Member = {
        id: `temp-${Date.now()}`,
        name: newMemberEmail.split('@')[0],
        email: newMemberEmail,
        avatar: null,
        role: 'En attente'
      };
      
      const newMembers = [...members, tempMember];
      setMembers(newMembers);
      const newMemberIndex = newMembers.length - 1;
      setInvitedMemberIndex(newMemberIndex);
      
      // Afficher l'infobulle pendant 6 secondes
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
      
      tooltipTimerRef.current = setTimeout(() => {
        setInvitedMemberIndex(null);
      }, 6000);

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', newMemberEmail.toLowerCase())
        .single();

      if (existingUser) {
        // L'utilisateur existe, l'ajouter directement à l'organisation via les attributs
        const { error } = await supabase
          .from('users')
          .update({ organization_id: organization.id })
          .eq('id', existingUser.id);

        if (error) {
          throw new Error("Impossible d'ajouter l'utilisateur à l'organisation.");
        }

        // Mettre à jour la liste des membres
        const { data: updatedUsers } = await supabase
          .from('users')
          .select('id, name, email, avatar')
          .eq('organization_id', organization.id);

        if (updatedUsers) {
          const formattedMembers: Member[] = updatedUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.id === authData.session?.user.id ? 'owner' : 'member'
          }));
          
          setMembers(formattedMembers);
        }
      } else {
        // L'utilisateur n'existe pas, tenter d'envoyer une invitation
        const response = await fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.session.access_token}`
          },
          body: JSON.stringify({
            email: newMemberEmail,
            organization_id: organization.id
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Impossible d'envoyer l'invitation.");
        }

        // Stocker le lien d'invitation
        if (result.invitationLink) {
          setCopySuccess(result.invitationLink);
        }
      }

      setNewMemberEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error("Erreur lors de l'invitation:", error);
      
      // Supprimer le membre temporaire en cas d'erreur
      setMembers(members.filter(m => m.email !== newMemberEmail));
      setInvitedMemberIndex(null);
    } finally {
      setIsInviting(false);
    }
  };

  const copyInvitationLink = (email: string) => {
    if (copySuccess) {
      navigator.clipboard.writeText(copySuccess);
      toast({
        title: "Lien copié !",
        description: "Le lien d'invitation a été copié dans le presse-papier.",
        duration: 3000
      });
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInitializationAndContinue = () => {
    console.log(`Initialisation avec l'option: ${initOption}`);
    
    window.dispatchEvent(new CustomEvent('onboarding-next-step'));
  };

  const handleFileImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setInitOption('import');
      console.log(`Fichier sélectionné: ${file.name}`);
    }
  };

  // Fonction pour générer des données de test
  const generateTestData = async () => {
    try {
      console.log("Démarrage de la génération de données de test...");
      const success = await demoDataGenerator.generateDemoData();
      console.log("Résultat de la génération:", success);
      
      if (success) {
        // Handle success case
      } else {
        // Handle failure case
      }
    } catch (error) {
      console.error("Erreur lors de la génération des données de test:", error);
    }
  };

  const steps = [
    {
      title: "Bienvenue sur MoneyApp",
      description: "Prenez le contrôle de vos finances, simplifiez vos dépenses, anticipez vos revenus, atteignez vos objectifs en toute sérénité.",
      content: (
        <div className="relative w-20 h-20 mb-6">
          <Image 
            src="/icon.png" 
            alt="MoneyApp Logo" 
            fill 
            className="object-contain"
            priority
          />
        </div>
      ),
    },
    {
      title: "Choisissez votre style",
      description: "Vous pouvez changer le thème à tout moment depuis les paramètres",
      content: <></>,
    },
    {
      title: "Votre foyer financier",
      description: "Invitez les membres de votre foyer pour gérer vos finances ensemble",
      content: (
        <div className="w-full flex flex-col items-center space-y-4">
          <h3 className="text-xl font-medium text-center dark:text-white">{organization.name}</h3>
          
          <p className="text-sm text-slate-500 dark:text-slate-300 -mt-1">{members.length} membre{members.length > 1 ? 's' : ''}</p>
          
          <div className="w-full border rounded-lg overflow-hidden border-slate-200 dark:border-slate-700" 
            style={{ 
              backgroundColor: 'var(--color-primary-50)',
            }}
          >
            <div className="flex items-center px-4 py-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">Nom</div>
              <div className="w-24 text-sm font-medium text-slate-600 dark:text-slate-300 text-right">Rôle</div>
            </div>
            
            <div className="max-h-[160px] overflow-y-auto bg-white dark:bg-slate-800/60">
              {members.length > 0 ? (
                members.map((member, index) => (
                  <div 
                    key={member.id} 
                    className={cn(
                      "flex items-center px-4 py-2 border-b border-slate-200 last:border-0 dark:border-slate-700",
                      member.id === currentUserId ? "bg-blue-50 dark:bg-blue-900/30" : ""
                    )}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-3 flex-shrink-0">
                        {member.avatar ? (
                          <Image 
                            src={member.avatar} 
                            alt={member.name} 
                            width={28} 
                            height={28} 
                            className="rounded-full object-cover" 
                          />
                        ) : (
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-200">
                            {member.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate dark:text-white text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="w-24 text-right flex justify-end items-center relative">
                      {member.role === 'En attente' ? (
                        <div className="flex items-center justify-end w-full group">
                          {(invitedMemberIndex === index || member.role === 'En attente') && (
                            <div 
                              className="absolute z-20 bg-slate-800 text-white text-[11px] rounded py-0.5 px-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                right: '100%',
                                marginRight: '8px'
                              }}
                            >
                              Cliquez pour copier le lien
                              <span className="absolute h-2 w-2 bg-slate-800 transform rotate-45 right-0 top-1/2 -translate-y-1/2 -mr-1"></span>
                            </div>
                          )}
                          <button
                            onClick={() => copyInvitationLink(member.email)}
                            className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-50 hover:bg-amber-200 dark:hover:bg-amber-600 transition-colors"
                          >
                            En attente
                          </button>
                        </div>
                      ) : (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          member.role === 'owner' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-50' 
                            : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-50'
                        )}>
                          {member.role === 'owner' ? 'Admin' : 'Membre'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300 text-center">
                  Aucun membre pour l'instant
                </div>
              )}
            </div>
          </div>
          
          {!showInviteForm ? (
            <div className="w-full flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 dark:text-blue-300 font-normal flex items-center"
                onClick={() => setShowInviteForm(true)}
              >
                Inviter
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-2">
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400 text-slate-900"
                />
                <Button 
                  onClick={handleInviteMember}
                  disabled={isInviting || !newMemberEmail}
                  className="whitespace-nowrap bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
                  size="sm"
                >
                  {isInviting ? 'Envoi...' : 'Inviter'}
                </Button>
              </div>
            </div>
          )}
          
          <div className="w-full flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 dark:text-slate-300 text-sm"
              onClick={() => window.dispatchEvent(new CustomEvent('onboarding-next-step'))}
            >
              Plus tard
            </Button>
            
            {members.length > 1 && (
              <Button
                variant="default"
                size="sm"
                className={cn(
                  "flex items-center min-w-[120px] h-[40px] font-medium",
                  theme === 'dark' 
                    ? "bg-blue-500 hover:bg-blue-600 text-white" 
                    : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white"
                )}
                onClick={() => window.dispatchEvent(new CustomEvent('onboarding-next-step'))}
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ),
      showBackButton: true
    },
    {
      title: "Initialisation de vos données",
      description: "Choisissez comment vous souhaitez démarrer avec MoneyApp",
      content: (
        <div className="flex flex-col w-full max-w-md mx-auto mt-6 space-y-8">
          <div className={cn(
            "rounded-xl overflow-hidden border shadow-sm",
            theme === 'dark'
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          )}>
            <div className={cn(
              "p-6 flex items-center justify-between",
              theme === 'dark' ? "border-b border-slate-700" : "border-b border-slate-200"
            )}>
              <div className="flex-1">
                <h3 className={cn(
                  "text-base font-medium mb-2",
                  theme === 'dark' ? "text-white" : "text-slate-800"
                )}>
                  Partir de zéro
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>
                  Commencez avec un compte vide et ajoutez vos transactions manuellement
                </p>
              </div>
              <Switch 
                checked={initOption === 'fromScratch'} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    const newOption = 'fromScratch';
                    setInitOption(newOption);
                    // Émettre un événement pour informer OnboardingTour
                    window.dispatchEvent(new CustomEvent('init-option-change', {
                      detail: { option: newOption }
                    }));
                    console.log("Option changée pour:", newOption);
                  }
                }}
                className={cn(
                  "data-[state=checked]:bg-blue-600",
                  theme === 'dark' && "data-[state=unchecked]:bg-slate-600"
                )}
              />
            </div>

            <div className={cn(
              "p-6 flex items-center justify-between",
              theme === 'dark' ? "border-b border-slate-700" : "border-b border-slate-200"
            )}>
              <div className="flex-1">
                <h3 className={cn(
                  "text-base font-medium mb-2",
                  theme === 'dark' ? "text-white" : "text-slate-800"
                )}>
                  Données de démonstration
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>
                  Explorez l'application avec des données préchargées pour vous familiariser
                </p>
              </div>
              <Switch 
                checked={initOption === 'demo'} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    const newOption = 'demo';
                    setInitOption(newOption);
                    // Émettre un événement pour informer OnboardingTour
                    window.dispatchEvent(new CustomEvent('init-option-change', {
                      detail: { option: newOption }
                    }));
                    console.log("Option changée pour:", newOption);
                  }
                }}
                className={cn(
                  "data-[state=checked]:bg-blue-600",
                  theme === 'dark' && "data-[state=unchecked]:bg-slate-600"
                )}
              />
            </div>
          </div>

          {currentUserId && members.some(member => 
            member.id === currentUserId && 
            member.name === "Elodie Soares"
          ) && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv,.json,.xlsx,.xls"
              />
              <button 
                className={cn(
                  "flex items-center justify-center mx-auto text-sm",
                  theme === 'dark' 
                    ? "text-blue-400 hover:text-blue-300" 
                    : "text-blue-500 hover:text-blue-400",
                  "transition-colors"
                )}
                onClick={handleFileImport}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Importer vos données existantes
                {importFile && <span className="ml-2 text-xs text-green-500">({importFile.name})</span>}
              </button>
            </>
          )}
        </div>
      ),
      showBackButton: true
    },
    {
      title: "Préparation de votre application",
      description: "Nous travaillons pour vous... (mais pas trop !)",
      content: (
        <div className="flex flex-col items-center justify-center w-full">
          {(() => {
            const [currentGroup, setCurrentGroup] = useState(1);
            const [showFinalReveal, setShowFinalReveal] = useState(false);
            
            const handleFirstGroupComplete = () => {
              setTimeout(() => {
                setCurrentGroup(2);
              }, 500);
            };
            
            const handleSecondGroupComplete = () => {
              setTimeout(() => {
                setCurrentGroup(3);
              }, 500);
            };
            
            const handleThirdGroupComplete = () => {
              setTimeout(() => {
                setShowFinalReveal(true);
              }, 500);
            };
            
            const handleFinalComplete = () => {
              window.dispatchEvent(new CustomEvent('onboarding-complete'));
            };
            
            console.log("Current theme in OnboardingGeneral:", theme);
            
            return (
              <div className="relative min-h-[350px] w-full">
                {currentGroup === 1 && !showFinalReveal && (
                  <div className="absolute inset-0 transition-transform duration-500" style={{ 
                    transform: 'translateX(0)' 
                  }}>
                    <AnimatedTask 
                      icon={
                        <Tags className={cn(
                          "h-full w-full",
                          theme === 'dark' ? "text-purple-400" : "text-purple-500"
                        )} />
                      }
                      title="Configuration des Catégories"
                      phrases={[
                        "Définition des catégories… `const tacos = true;`",
                        "Initialisation du state… `useState({ café: 'prioritaire' });`",
                        "Tri des données… `sort(data, (a, b) => a.café - b.café);` ou pas, on s'en fiche"
                      ]}
                      theme={theme}
                      onComplete={handleFirstGroupComplete}
                    />
                  </div>
                )}
                
                {currentGroup === 2 && !showFinalReveal && (
                  <SecondGroup 
                    show={true} 
                    theme={theme} 
                    onComplete={handleSecondGroupComplete}
                  />
                )}
                
                {currentGroup === 3 && !showFinalReveal && (
                  <ThirdGroup 
                    show={true} 
                    theme={theme} 
                    onComplete={handleThirdGroupComplete}
                  />
                )}
                
                {showFinalReveal && (
                  <FinalReveal
                    show={true}
                    theme={theme}
                    onComplete={handleFinalComplete}
                  />
                )}
              </div>
            );
          })()}
        </div>
      ),
      showBackButton: true
    },
    {
      title: "Vous êtes prêt à démarrer !",
      description: "Découvrez les fonctionnalités essentielles pour tirer le meilleur parti de MoneyApp",
      content: (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto space-y-8">
          <div className={cn(
            "w-full p-6 rounded-xl border flex flex-col items-center text-center",
            theme === 'dark' 
              ? "bg-blue-900/20 border-blue-800" 
              : "bg-blue-50 border-blue-100"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className={cn(
                "h-5 w-5",
                theme === 'dark' ? "text-blue-400" : "text-blue-500"
              )} />
              <p className={cn(
                "text-sm font-medium",
                theme === 'dark' ? "text-blue-300" : "text-blue-700"
              )}>
                Le saviez-vous ?
              </p>
            </div>
            
            <p className={cn(
              "text-sm mb-4",
              theme === 'dark' ? "text-slate-300" : "text-slate-700"
            )}>
              Accédez à tout moment à vos notes partagées en utilisant le raccourci
            </p>
            
            <div className="flex items-center gap-2">
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-md shadow-sm",
                theme === 'dark' ? "bg-slate-700 border border-slate-600" : "bg-white border border-slate-200"
              )}>
                <span className={cn(
                  "text-xs font-semibold",
                  theme === 'dark' ? "text-slate-200" : "text-slate-800"
                )}>CTRL</span>
              </div>
              
              <span className={cn(
                "text-lg font-medium",
                theme === 'dark' ? "text-slate-400" : "text-slate-500"
              )}>+</span>
              
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-md shadow-sm",
                theme === 'dark' ? "bg-slate-700 border border-slate-600" : "bg-white border border-slate-200"
              )}>
                <span className={cn(
                  "text-base font-semibold",
                  theme === 'dark' ? "text-slate-200" : "text-slate-800"
                )}>N</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              variant="default"
              className={cn(
                "min-w-[180px] h-10 font-medium",
                theme === 'dark' 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
              onClick={() => window.dispatchEvent(new CustomEvent('onboarding-complete'))}
            >
              Commencer
            </Button>
            
            <Button
              variant="outline"
              className={cn(
                "min-w-[180px] h-10 font-medium",
                theme === 'dark' 
                  ? "border-slate-700 hover:bg-slate-800 text-slate-300" 
                  : "border-slate-200 hover:bg-slate-100 text-slate-700"
              )}
              onClick={() => window.dispatchEvent(new CustomEvent('onboarding-next-step'))}
            >
              Découvrir les fonctionnalités
            </Button>
          </div>
        </div>
      ),
      showBackButton: true
    },
  ]

  return (
    <>
      <OnboardingTour steps={steps} type="new-user" />
      {children}
    </>
  );
} 