"use client"

import Image from "next/image"
import Link from "next/link"
import React, { useState, useEffect, ReactNode, useRef } from "react"
import { Plus, CheckCircle, ArrowRight, Paperclip, Keyboard, Sparkles, Atom, Sparkle, FileSpreadsheet, X } from "lucide-react"
import { OnboardingTour } from "./OnboardingTour"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/format"

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

function AnimatedTask({ icon, title, phrases, theme = 'light', onComplete }: AnimatedTaskProps) {
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
  theme?: 'light' | 'dark';
  onComplete?: () => void;
}

function _SecondGroup({ show, theme = 'light', onComplete }: SecondGroupProps) {
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
          "Calcul des projections… `if (revenus > dépenses) console.log(&apos;Chill!&apos;);` ou panique.",
          "Chargement des graphiques… `import matplotlib as plt;` ou Google Images."
        ]}
        theme={theme}
      />
    </div>
  );
}

interface ThirdGroupProps {
  show: boolean;
  theme?: 'light' | 'dark';
  onComplete?: () => void;
}

function _ThirdGroup({ show, theme = 'light', onComplete }: ThirdGroupProps) {  
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
  theme?: 'light' | 'dark';
  onComplete: () => void;
}

function _FinalReveal({ show, theme = 'light', onComplete }: FinalRevealProps) {
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

// Ajouter cette interface pour les données importées
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

// Remplacer le contenu de la modale de validation finale par un résumé et feux d'artifice
function _SuccessImportContent({ year, totalCategories, totalSubcategories }: { 
  year: string; 
  totalCategories: number; 
  totalSubcategories: number; 
}) {
  React.useEffect(() => {
    // Créer les éléments de feux d'artifice
    const container = document.querySelector('#radix-\\:r1\\:') as HTMLElement;
    if (container) {
      // Nettoyer le contenu existant
      const existingContent = container.querySelector('.py-4 > div > div.flex.flex-col.items-center.justify-center.py-2');
      if (existingContent) {
        existingContent.innerHTML = '';
      }
      
      // Style pour le conteneur parent
      container.style.overflow = 'hidden';
      container.style.position = 'relative';
      
      // Créer les feux d'artifice
      for (let i = 0; i < 5; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = `${Math.random() * 100}%`;
        firework.style.top = `${Math.random() * 100}%`;
        firework.style.animationDelay = `${Math.random() * 1}s`;
        container.appendChild(firework);
      }
    }
    
    return () => {
      // Nettoyer les feux d'artifice lors du démontage
      if (container) {
        const fireworks = container.querySelectorAll('.firework');
        fireworks.forEach(fw => fw.remove());
        container.style.overflow = '';
        container.style.position = '';
      }
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center py-8 relative z-10">
      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
        Importation réussie!
      </div>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-4 w-full max-w-md">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 text-center">
          Résumé des données importées
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center border-b pb-2 border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Année:</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{year}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2 border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Catégories:</span>
            <span className="font-medium text-blue-700 dark:text-blue-400">{totalCategories}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Sous-catégories:</span>
            <span className="font-medium text-blue-700 dark:text-blue-400">{totalSubcategories}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnboardingGeneral({ children }: OnboardingGeneralProps) {
  const [organization, setOrganization] = useState<{ id: string; name: string }>({ id: '', name: 'Votre foyer' });
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [invitedMemberIndex, setInvitedMemberIndex] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [initOption, setInitOption] = useState<'fromScratch' | 'demo' | 'import'>('fromScratch');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importYear, setImportYear] = useState<string>("");
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<{name: string, category: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryMappings, setCategoryMappings] = useState<{[key: string]: string}>({});
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [importComplete, setImportComplete] = useState(false);
  const [transactionsCount, setTransactionsCount] = useState(0);
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
  
  // Ajouter useEffect pour les styles des feux d'artifice
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Fireworks effect */
      .firework-container {
        position: relative;
        overflow: hidden;
      }
      
      .firework {
        position: absolute;
        width: 0.2rem;
        height: 0.2rem;
        border-radius: 50%;
        transform-origin: center;
        animation: firework 0.8s ease-out infinite;
      }
      
      @keyframes firework {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }
      }
      
      .firework-green {
        box-shadow: 0 0 0 0.4rem #9ae6b4, 0 0 0 0.8rem #48bb78, 0 0 0 1.2rem #38a169;
      }
      
      .firework-blue {
        box-shadow: 0 0 0 0.4rem #90cdf4, 0 0 0 0.8rem #4299e1, 0 0 0 1.2rem #3182ce;
      }
      
      .firework-orange {
        box-shadow: 0 0 0 0.4rem #fbd38d, 0 0 0 0.8rem #ed8936, 0 0 0 1.2rem #dd6b20;
      }
      
      .firework-pink {
        box-shadow: 0 0 0 0.4rem #fbb6ce, 0 0 0 0.8rem #ed64a6, 0 0 0 1.2rem #d53f8c;
      }
      
      .firework-purple {
        box-shadow: 0 0 0 0.4rem #d6bcfa, 0 0 0 0.8rem #9f7aea, 0 0 0 1.2rem #6b46c1;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
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

  // Fonction préservée pour une utilisation future
  const _handleInitializationAndContinue = () => {
    console.log(`Initialisation avec l&apos;option: ${initOption}`);
    
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
      console.log(`Fichier sélectionné: ${file.name}`);
      setImportFile(file);
      setInitOption('import');
      
      // Ouvrir la modale seulement si elle n'était pas déjà ouverte (cas d'une nouvelle importation)
      if (!importDialogOpen) {
      setImportDialogOpen(true);
      } else {
        // Si la modale était déjà ouverte (mais cachée), la réafficher
        setTimeout(() => {
          setImportDialogOpen(true);
        }, 300);
      }
    }
  };

  const handleImportYearSelect = (year: string) => {
    setImportYear(year);
  };

  const processExcelFile = async () => {
    if (!importFile || !importYear) return;
    
    setImportStatus('processing');
    setImportError(null); // Réinitialiser les erreurs précédentes
    
    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('year', importYear);
      
      console.log(`Traitement du fichier: ${importFile.name}, année: ${importYear}`);
      
      // Appeler l'API backend pour traiter le fichier
      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const errorMessage = errorData.error || `Erreur lors du traitement du fichier: ${response.statusText}`;
        console.error("Erreur d'importation:", errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Réponse de l'API:", data);
      
      // Utiliser directement les données brutes si elles sont disponibles
      const rawData = data.data || [];
      const columns = data.columns || [];
      
      console.log("Données brutes:", rawData);
      console.log("Colonnes:", columns);
      
      // Extraire les sous-catégories du fichier
      // Même si aucune sous-catégorie n'est trouvée, on continue avec une sous-catégorie par défaut
      const subcategoriesList = data.subcategories && data.subcategories.length > 0 
        ? data.subcategories 
        : ["Non catégorisé"];
      
      console.log("Sous-catégories extraites:", subcategoriesList);
      
      // Récupérer les catégories existantes depuis Supabase
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, type')
        .order('name');
      
      // Récupérer toutes les sous-catégories existantes
      const { data: existingSubcategories } = await supabase
        .from('subcategories')
        .select('id, name, category_id');

      console.log("Sous-catégories existantes:", existingSubcategories);
      
      // Créer un mapping entre les noms de sous-catégories existantes et leurs catégories
      const subcategoryMap = new Map();
      if (existingSubcategories) {
        existingSubcategories.forEach(subcat => {
          // Utiliser toLowerCase() pour une comparaison insensible à la casse
          subcategoryMap.set(subcat.name.toLowerCase(), subcat.category_id);
        });
      }
      
      // Traiter les sous-catégories importées
      const processedSubcategories = subcategoriesList.map((name: string) => {
        // Rechercher la sous-catégorie existante (insensible à la casse)
        const categoryId = subcategoryMap.get(name.toLowerCase());
        return { 
          name, 
          category: categoryId || "" 
        };
      });
      
      setSubcategories(processedSubcategories);
      
      if (categoriesData) {
        // Stocker les IDs des catégories avec leurs noms
        const categoryIds = categoriesData.reduce((acc: {[key: string]: string}, cat: {id: string, name: string, type: string}) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {});
        
        // Convertir les IDs de catégories en noms dans les mappings
        const initialMappings: {[key: string]: string} = {};
        processedSubcategories.forEach((subcat: {name: string, category: string}) => {
          if (subcat.category) {
            initialMappings[subcat.name] = categoryIds[subcat.category];
          }
        });
        setCategoryMappings(initialMappings);
        
        // Stocker les catégories pour le dropdown
        setCategories(categoriesData.map(cat => cat.name));
      }
      
      // Passer à l'étape 2 seulement s'il reste des sous-catégories à associer
      const unmappedSubcategories = processedSubcategories.filter((subcat: {name: string, category: string}) => !subcat.category);
      
      console.log("Sous-catégories non mappées:", unmappedSubcategories);
      
      if (unmappedSubcategories.length > 0) {
        setImportStep(2);
      } else {
        // Si toutes les sous-catégories sont déjà mappées, passer directement à la finalisation
        finalizeImport();
      }
      
      setImportStatus('success');
    } catch (error) {
      console.error("Erreur détaillée lors du traitement du fichier Excel:", error);
      setImportError(error instanceof Error ? error.message : "Une erreur est survenue lors du traitement");
      setImportStatus('error');
      
      // Afficher un toast d'erreur
      toast({
        variant: "destructive",
        title: "Erreur d'importation",
        description: error instanceof Error ? error.message : "Une erreur inattendue est survenue",
      });
    }
  };

  const handleCategoryMapping = (subcategoryName: string, categoryName: string) => {
    setCategoryMappings(prev => ({
      ...prev,
      [subcategoryName]: categoryName
    }));
  };

  const _handleAddNewCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      // Ajouter la nouvelle catégorie à Supabase
      const { error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategory.trim(),
          type: 'expense'
        }])
        .select();
      
      if (error) throw error;
      
      // Mettre à jour la liste des catégories
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
      
      toast({
        title: "Catégorie ajoutée",
        description: `La catégorie "${newCategory.trim()}" a été ajoutée avec succès.`,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la catégorie:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter la catégorie.",
      });
    }
  };

  const finalizeImport = async () => {
    setImportStatus('processing');
    
    try {
      // Récupérer les vraies données depuis l'API au lieu d'utiliser des données de test
      const formData = new FormData();
      if (importFile) {
        formData.append('file', importFile);
      }
      formData.append('year', importYear);
      
      console.log("Récupération des données réelles pour l'aperçu...");
      
      // Appeler l'API pour obtenir les données traitées
      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Erreur lors de la récupération des données: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Données reçues pour l'aperçu:", data);
      
      // Construire la structure de données attendue par DataPreview à partir des données Excel
      let importedDataForPreview: ImportedData = {
        categories: {}
      };
      
      // Si le backend nous a envoyé des données déjà formatées dans data.preview
      if (data.preview && typeof data.preview === 'object') {
        importedDataForPreview = data.preview;
      } 
      // Si le backend nous a envoyé des données brutes de Excel (format tableau)
      else if (data.data && Array.isArray(data.data)) {
        // Transformer le format tableau en format attendu par DataPreview
        
        // Récupérer les noms des mois depuis les en-têtes
        const monthHeaders = data.columns ? data.columns.slice(1) : ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        
        console.log("En-têtes des mois:", monthHeaders);
        
        // Fonction pour déterminer le numéro de mois à partir de son nom
        const getMonthNumber = (monthName: string): string => {
          // Tableaux des différentes variantes de noms de mois
          const months = {
            '01': ['janv', 'jan', 'janvier', 'january'],
            '02': ['fév', 'fev', 'février', 'feb', 'february'],
            '03': ['mars', 'mar', 'march'],
            '04': ['avr', 'avril', 'apr', 'april'],
            '05': ['mai', 'may'],
            '06': ['juin', 'jun', 'june'],
            '07': ['juil', 'jul', 'juillet', 'july'],
            '08': ['août', 'aout', 'aug', 'august'],
            '09': ['sept', 'sep', 'septembre', 'september'],
            '10': ['oct', 'octobre', 'october'],
            '11': ['nov', 'novembre', 'november'],
            '12': ['déc', 'dec', 'décembre', 'december']
          };
          
          // Convertir en minuscules pour la comparaison
          const lowerMonthName = monthName.toLowerCase().trim();
          
          // Parcourir les mois et leurs variantes
          for (const [num, names] of Object.entries(months)) {
            if (names.some(name => lowerMonthName.includes(name))) {
              return num;
            }
          }
          
          // Si non trouvé, retourner la chaîne originale
          return monthName;
        };
        
        // Parcourir les données du tableau
        data.data.forEach((row: any[]) => {
          if (!row || row.length === 0) return;
          
          // La première colonne contient le nom de la sous-catégorie
          const subcategoryName = row[0];
          if (!subcategoryName) return;
          
          // Ignorer les lignes d'en-tête ou vides
          if (typeof subcategoryName === 'string' && 
              (subcategoryName.toLowerCase().includes('catégorie') || 
               subcategoryName.trim() === '')) {
            return;
          }
          
          // Trouver la catégorie associée à cette sous-catégorie via les mappings
          const categoryName = categoryMappings[subcategoryName] || "Non catégorisé";
          
          // S'assurer que la catégorie existe dans notre structure
          if (!importedDataForPreview.categories[categoryName]) {
            importedDataForPreview.categories[categoryName] = {
              subcategories: {}
            };
          }
          
          // Ajouter la sous-catégorie avec ses valeurs mensuelles
          importedDataForPreview.categories[categoryName].subcategories[subcategoryName] = {};
          
          // Ajouter les valeurs pour chaque mois
          monthHeaders.forEach((monthHeader: string, index: number) => {
            // Convertir le nom du mois en format numérique
            let monthKey = getMonthNumber(monthHeader);
            
            // Si le mois n'est pas au format correct (01-12), utiliser l'index + 1
            if (!/^(0[1-9]|1[0-2])$/.test(monthKey)) {
              monthKey = (index + 1).toString().padStart(2, '0');
            }
            
            // Récupérer la valeur
            const rawValue = row[index + 1];
            
            // Traiter correctement les nombres
            let value = 0;
            
            // Si la valeur est nulle ou vide
            if (rawValue === "" || rawValue === null || rawValue === undefined) {
              value = 0;
            }
            // Si la valeur est déjà un nombre, l'utiliser directement
            else if (typeof rawValue === 'number') {
              value = rawValue;
            } 
            // Si c'est une chaîne avec une virgule, la convertir correctement
            else if (typeof rawValue === 'string' && rawValue.includes(',')) {
              value = parseFloat(rawValue.replace(',', '.'));
            }
            // Sinon, essayer de la convertir en nombre
            else {
              try {
                value = Number(rawValue);
                if (isNaN(value)) value = 0;
              } catch (e) {
                console.error(`Erreur lors de la conversion de ${rawValue}:`, e);
              value = 0;
              }
            }
            
            console.log(`Sous-catégorie: ${subcategoryName}, Mois: ${monthKey} (${monthHeader}), Valeur brute: ${rawValue}, Valeur convertie: ${value}`);
            
            // Utiliser la valeur convertie
            importedDataForPreview.categories[categoryName].subcategories[subcategoryName][monthKey] = value;
          });
        });
      } 
      // Si nous avons des données dans un autre format
      else {
        console.log("Format de données non reconnu, utilisation des mappings pour créer une structure compatible");
        
        // Fallback: utiliser les mappings de catégories pour organiser les données
        Object.entries(categoryMappings).forEach(([subcategoryName, categoryName]) => {
          if (!importedDataForPreview.categories[categoryName]) {
            importedDataForPreview.categories[categoryName] = {
              subcategories: {}
            };
          }
          
          // Utiliser les données du backend si disponibles, sinon créer des données fictives
          if (data.subcategories && data.subcategories[subcategoryName]) {
            importedDataForPreview.categories[categoryName].subcategories[subcategoryName] = data.subcategories[subcategoryName];
          } else {
            // Ajouter la sous-catégorie avec des données fictives comme dernier recours
            importedDataForPreview.categories[categoryName].subcategories[subcategoryName] = {
              "01": Math.random() * 500,
              "02": Math.random() * 500,
              "03": Math.random() * 500
            };
          }
        });
      }
      
      console.log("Données formatées pour l'aperçu:", importedDataForPreview);
      
      // Stocker les données importées pour l'aperçu
      setImportedData(importedDataForPreview);
      
      // Calculer le nombre de transactions
      const transactionCount = Object.values(importedDataForPreview.categories).reduce((count, category) => {
        return count + Object.keys(category.subcategories).length;
      }, 0);
      
      setTransactionsCount(data.transactionsCount || transactionCount);
      
      setImportStatus('success');
      setImportStep(3);
      
    } catch (error) {
      console.error("Erreur lors de la validation de l'importation:", error);
      setImportError(error instanceof Error ? error.message : "Une erreur est survenue");
      setImportStatus('error');
    }
  };

  // Interface pour les données de transaction
  interface TransactionData {
    amount: number;
    description: string;
    transaction_date: string;
    accounting_date: string;
    category_id: string;
    subcategory_id: string;
    user_id: string;
    organization_id: string;
    expense_type: string;
    is_income: boolean;
    split_ratio: number;
  }

  // Ajouter cette fonction pour créer les transactions dans Supabase
  const createTransactionsFromImportedData = async () => {
    setImportStatus('processing');
    
    try {
      // Récupérer l'utilisateur connecté
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Utilisateur non connecté");
      
      // Récupérer l'organisation de l'utilisateur
      const { data: orgData, error: orgError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();
        
      if (orgError) throw orgError;
      if (!orgData.organization_id) throw new Error("Aucune organisation associée à l'utilisateur");
      
      // Récupérer les catégories et sous-catégories existantes
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('id, name, type');
        
      if (catError) throw catError;
      
      const { data: subcategoriesData, error: subcatError } = await supabase
        .from('subcategories')
        .select('id, name, category_id');
        
      if (subcatError) throw subcatError;
      
      // Créer un mapping des noms vers IDs pour les catégories et sous-catégories
      const categoryMap = new Map();
      categoriesData.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), {
          id: cat.id,
          type: cat.type
        });
      });
      
      const subcategoryMap = new Map();
      subcategoriesData.forEach(subcat => {
        subcategoryMap.set(subcat.name.toLowerCase(), {
          id: subcat.id,
          category_id: subcat.category_id
        });
      });
      
      // Préparer les transactions à partir des données importées
      const transactions: TransactionData[] = [];
      let successCount = 0;
      
      if (!importedData) throw new Error("Aucune donnée importée");
      
      // Parcourir les catégories
      Object.entries(importedData.categories).forEach(([categoryName, category]) => {
        // Déterminer si c'est un revenu
        const isIncome = ["Revenus exceptionnels", "Revenus réguliers"].includes(categoryName);
        
        // Récupérer l'ID de la catégorie
        const categoryInfo = categoryMap.get(categoryName.toLowerCase());
        if (!categoryInfo) {
          console.warn(`Catégorie non trouvée dans la base de données: ${categoryName}`);
          return; // Passer à la catégorie suivante
        }
        
        // Parcourir les sous-catégories
        Object.entries(category.subcategories).forEach(([subcategoryName, monthData]) => {
          // Récupérer l'ID de la sous-catégorie
          const subcategoryInfo = subcategoryMap.get(subcategoryName.toLowerCase());
          if (!subcategoryInfo) {
            console.warn(`Sous-catégorie non trouvée dans la base de données: ${subcategoryName}`);
            return; // Passer à la sous-catégorie suivante
          }
          
          // Vérifier que la sous-catégorie appartient bien à la catégorie
          if (subcategoryInfo.category_id !== categoryInfo.id) {
            console.warn(`La sous-catégorie ${subcategoryName} n'appartient pas à la catégorie ${categoryName}`);
            return; // Passer à la sous-catégorie suivante
          }
          
          // Parcourir les mois
          Object.entries(monthData).forEach(([month, amount]) => {
            // Ne créer une transaction que si le montant est supérieur à 0
            if (amount <= 0) return;
            
            // Créer la date (15 du mois)
            const monthNumber = parseInt(month);
            if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
              console.warn(`Format de mois invalide: ${month}`);
              return; // Passer au mois suivant
            }
            
            // Formater la date au format YYYY-MM-DD
            const transactionDate = `${importYear}-${month.padStart(2, '0')}-15`;
            
            // Préparer les données de la transaction
            const transactionData = {
              amount: amount,
              description: `Import automatique - ${subcategoryName}`,
              transaction_date: transactionDate,
              accounting_date: transactionDate,
              category_id: categoryInfo.id,
              subcategory_id: subcategoryInfo.id,
              user_id: userData.user.id,
              organization_id: orgData.organization_id,
              expense_type: isIncome ? 'couple' : 'couple', // Par défaut, toutes les transactions sont de type "couple"
              is_income: isIncome,
              split_ratio: 50.00 // Par défaut, répartition 50/50
            };
            
            transactions.push(transactionData);
            successCount++;
          });
        });
      });
      
      console.log(`Nombre de transactions préparées: ${transactions.length}`);
      
      // Insérer les transactions par lots pour éviter les limitations d'API
      const BATCH_SIZE = 50;
      for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
        const batch = transactions.slice(i, i + BATCH_SIZE);
        
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(batch);
          
        if (insertError) {
          console.error('Erreur lors de l\'insertion des transactions:', insertError);
          throw insertError;
        }
      }
      
      console.log(`${successCount} transactions créées avec succès`);
      setTransactionsCount(successCount);
      setImportStatus('success');
      setImportComplete(true);
      
    } catch (error) {
      console.error("Erreur lors de la création des transactions:", error);
      setImportError(error instanceof Error ? error.message : "Une erreur est survenue");
      setImportStatus('error');
    }
  };

  const _completeImport = async () => {
    setImportStatus('processing');
    
    try {
      // Simuler la création des transactions sans appeler l'API
      console.log("Simulation de création des transactions dans Supabase");
      
      // Attendre un peu pour simuler le traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setImportStatus('success');
      setImportComplete(true);
      
    } catch (error) {
      console.error("Erreur lors de la finalisation de l'importation:", error);
      setImportError(error instanceof Error ? error.message : "Une erreur est survenue");
      setImportStatus('error');
    }
  };

  const resetImport = () => {
    // Fermer la modale actuelle pour éviter les interférences
    setImportDialogOpen(false);
    
    // Réinitialiser les états
    setImportFile(null);
    setImportYear("");
    setImportStatus('idle');
    setImportError(null);
    setSubcategories([]);
    setCategoryMappings({});
    setImportedData(null);
    setImportComplete(false);
    setImportStep(1);
    
    // Réinitialiser la valeur du fileInput pour permettre une nouvelle sélection du même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Utiliser setTimeout pour s'assurer que la modale est bien fermée avant de déclencher la nouvelle sélection
    setTimeout(() => {
      // Déclencher le sélecteur de fichier
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      
      // Réouvrir la modale après un court délai pour être sûr que le fichier a été sélectionné
      setTimeout(() => {
        if (importFile) {
          setImportDialogOpen(true);
        }
      }, 500);
    }, 300);
  };

  // Fonction pour créer une nouvelle catégorie directement depuis le dropdown
  const CreateNewCategoryItem = ({ onSelect }: { onSelect: (value: string) => void }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    
    const handleCreate = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!newCategoryName.trim()) return;
      
      try {
        // Ajouter la nouvelle catégorie à Supabase
        const { data, error } = await supabase
          .from('categories')
          .insert([{ 
            name: newCategoryName.trim(),
            type: 'expense'
          }])
          .select();
        
        if (error) throw error;
        
        // Mettre à jour la liste des catégories
        setCategories([...categories, newCategoryName.trim()]);
        
        // Sélectionner la nouvelle catégorie
        onSelect(newCategoryName.trim());
        
        // Réinitialiser l'état
        setNewCategoryName("");
        setIsCreating(false);
        
        toast({
          title: "Catégorie ajoutée",
          description: `La catégorie "${newCategoryName.trim()}" a été ajoutée avec succès.`,
        });
      } catch (error) {
        console.error("Erreur lors de l'ajout de la catégorie:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'ajouter la catégorie.",
        });
      }
    };
    
    if (isCreating) {
      return (
        <div className="flex items-center gap-2 px-2 py-1.5" onClick={e => e.stopPropagation()}>
          <Input
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Nom de la catégorie"
            className="h-8 flex-1"
            autoFocus
          />
          <Button 
            size="sm" 
            className="h-8 px-2" 
            onClick={handleCreate}
            disabled={!newCategoryName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCreating(false);
              setNewCategoryName("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    
    return (
      <div 
        className="relative flex items-center px-2 py-1.5 text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsCreating(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Créer une nouvelle catégorie
      </div>
    );
  };

  // Fonction pour afficher l'aperçu des données importées
  const DataPreview = ({ data, year }: { data: ImportedData; year: string }) => {
    // Catégories considérées comme des revenus
    const incomeCategories = ["Revenus exceptionnels", "Revenus réguliers"];

    // Extraire les mois uniques de toutes les données
    const allMonths = new Set<string>();
    Object.values(data.categories).forEach(category => {
      Object.values(category.subcategories).forEach(subcategory => {
        Object.keys(subcategory).forEach(month => {
          allMonths.add(month);
        });
      });
    });
    
    // Convertir en tableau et trier
    const months = Array.from(allMonths).sort();
    
    // Fonction pour formater le nom du mois
    const formatMonth = (month: string) => {
      const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      const monthIndex = parseInt(month) - 1;
      return monthIndex >= 0 && monthIndex < 12 ? monthNames[monthIndex] : month;
    };
    
    // Calculer les totaux par mois et par type (revenus/dépenses)
    const monthlyTotals = {
      income: {} as Record<string, number>,
      expense: {} as Record<string, number>,
      total: {} as Record<string, number>
    };
    
    months.forEach(month => {
      monthlyTotals.income[month] = 0;
      monthlyTotals.expense[month] = 0;
      
      Object.entries(data.categories).forEach(([categoryName, category]) => {
        const isIncome = incomeCategories.includes(categoryName);
        Object.values(category.subcategories).forEach(subcategory => {
          if (subcategory[month]) {
            if (isIncome) {
              monthlyTotals.income[month] += subcategory[month];
            } else {
              monthlyTotals.expense[month] += subcategory[month];
            }
          }
        });
      });
      
      // Calculer la balance mensuelle
      monthlyTotals.total[month] = monthlyTotals.income[month] - monthlyTotals.expense[month];
    });
    
    // Calculer les totaux généraux
    const grandTotals = {
      income: Object.values(monthlyTotals.income).reduce((sum, value) => sum + value, 0),
      expense: Object.values(monthlyTotals.expense).reduce((sum, value) => sum + value, 0),
      balance: 0
    };
    
    grandTotals.balance = grandTotals.income - grandTotals.expense;

    // Supprimer la fonction toggleFullscreen qui n'est plus nécessaire
    
    // Obtenir le nombre total de catégories et sous-catégories
    const totalCategories = Object.keys(data.categories).length;
    const totalSubcategories = Object.values(data.categories).reduce(
      (count, cat) => count + Object.keys(cat.subcategories).length, 0
    );
    
    // Injecter les styles pour l'effet de bordure gradient et autres styles
    React.useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        /* Style headers */
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .sticky-row-header {
          position: sticky;
          left: 0;
          z-index: 30;
          background-color: inherit;
        }
        
        .sticky-subcat-header {
          position: sticky;
          left: 120px;
          z-index: 20;
          background-color: inherit;
        }
        
        /* Style footer */
        .sticky-footer {
          position: sticky;
          bottom: 0;
          z-index: 40;
          box-shadow: 0 -1px 3px rgba(0,0,0,0.1);
        }
        
        /* Hover effects */
        .data-row:hover {
          background-color: rgba(241, 245, 249, 0.5) !important;
        }
        
        .dark .data-row:hover {
          background-color: rgba(30, 41, 59, 0.5) !important;
        }
        
        /* Table border effect */
        .table-with-gradient {
          --light-start-color: #e2e8f0;
          --light-mid-color: #2563eb;
          --light-focus-color: #3b82f6;
          --light-deep-color: #1e40af;
          --dark-start-color: #334155;
          --dark-mid-color: #3b82f6;
          --dark-focus-color: #60a5fa;
          --dark-deep-color: #2563eb;
          transition: background 0.3s ease, box-shadow 0.3s ease;
          background: linear-gradient(#fff, #fff) padding-box, 
                   linear-gradient(to right, 
                                 var(--light-start-color), 
                                 var(--light-mid-color) 50%, 
                                 var(--light-start-color)) border-box !important;
        }
        
        .dark .table-with-gradient {
          background: linear-gradient(#0f172a, #0f172a) padding-box, 
                   linear-gradient(to right, 
                                  var(--dark-start-color), 
                                  var(--dark-mid-color) 50%, 
                                  var(--dark-start-color)) border-box !important;
        }
        
        /* Font size helper */
        .text-2xs {
          font-size: 0.65rem;
          line-height: 0.9rem;
        }
        
        /* Info banner */
        .import-info-banner {
          background-color: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .dark .import-info-banner {
          background-color: rgba(56, 189, 248, 0.05);
          border-color: rgba(56, 189, 248, 0.1);
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }, []);
    
    // Calculer le nombre total de transactions (sous-catégories × mois avec des valeurs)
    const calculateTotalTransactions = () => {
      let total = 0;
      Object.values(data.categories).forEach(category => {
        Object.values(category.subcategories).forEach(subcategory => {
          Object.values(subcategory).forEach(value => {
            if (value > 0) total++;
                        });
                      });
      });
      return total;
    };
    
    const totalTransactions = calculateTotalTransactions();
    
    return (
      <div className="w-full">
        {/* Bannière d'information */}
        <div className="import-info-banner">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Données pour l&apos;année <span className="text-blue-700 dark:text-blue-400">{year}</span> chargées avec succès
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString()}
            </span>
                          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-blue-700 dark:text-blue-400">{totalTransactions}</span> transactions réparties entre <span className="font-semibold text-blue-700 dark:text-blue-400">{totalCategories}</span> catégories et <span className="font-semibold text-blue-700 dark:text-blue-400">{totalSubcategories}</span> sous-catégories.
          </p>
                          </div>
        
        <div className="data-table-wrapper border rounded-md overflow-hidden shadow-sm table-with-gradient h-[350px] w-full relative">
          <div className="absolute inset-0">
            <div className="flex flex-col h-full">
              <div className="flex-grow min-h-0 overflow-hidden">
                <ScrollArea className="h-full" type="always">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="w-full border-collapse text-sm table-auto">
                        <thead className="sticky-header bg-slate-100 dark:bg-slate-800 border-b dark:border-slate-700">
                          <tr>
                            <th className="p-3 font-semibold text-slate-900 dark:text-slate-100 border-r dark:border-slate-700 text-left sticky-row-header left-0 z-30 bg-slate-100 dark:bg-slate-800 w-[120px]">
                              Catégorie
                            </th>
                            <th className="p-3 font-semibold text-slate-900 dark:text-slate-100 border-r dark:border-slate-700 text-left sticky-subcat-header left-[120px] z-20 bg-slate-100 dark:bg-slate-800 w-[140px]">
                              Sous-catégorie
                            </th>
                          {months.map(month => (
                              <th key={month} className="p-3 font-semibold text-slate-900 dark:text-slate-100 text-right border-r last:border-r-0 dark:border-slate-700 w-[95px] min-w-[95px]">
                                {formatMonth(month)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {Object.entries(data.categories).map(([categoryName, category]) => {
                            const isIncome = incomeCategories.includes(categoryName);
                            
                            return (
                              <React.Fragment key={categoryName}>
                                {Object.entries(category.subcategories).map(([subcategoryName, monthData], index) => (
                                  <tr 
                                    key={`${categoryName}-${subcategoryName}`}
                          className={cn(
                                      "data-row border-b dark:border-slate-700 last:border-b-0 transition-colors",
                                      isIncome 
                                        ? "bg-blue-50/30 dark:bg-blue-900/10" 
                                        : index % 2 === 0 
                                          ? "bg-white dark:bg-slate-900" 
                                          : "bg-slate-50/50 dark:bg-slate-800/30"
                                    )}
                                  >
                                    <td className="p-3 text-slate-900 dark:text-slate-200 border-r dark:border-slate-700 sticky-row-header left-0 z-10 text-xs">
                                      {index === 0 && (
                                        <div className={cn(
                                          "font-medium",
                                          isIncome ? "text-blue-700 dark:text-blue-400" : ""
                                        )}>
                                          {categoryName}
                          </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300 border-r dark:border-slate-700 sticky-subcat-header left-[120px] z-10 text-xs">
                                      {subcategoryName}
                                    </td>
                          {months.map(month => (
                                      <td key={month} className="p-3 text-right text-slate-800 dark:text-slate-200 border-r last:border-r-0 dark:border-slate-700 text-xs">
                                        {monthData[month] ? formatCurrency(monthData[month]) : "-"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                        <tfoot className="sticky-footer bg-slate-100 dark:bg-slate-800 backdrop-blur-sm border-t shadow-md">
                          <tr className="border-b dark:border-slate-700">
                            <td colSpan={2} className="p-3 font-semibold text-blue-700 dark:text-blue-400 border-r dark:border-slate-700 sticky-row-header left-0 z-20 bg-slate-100 dark:bg-slate-800 text-xs">
                              Total Revenus
                            </td>
                            {months.map(month => (
                              <td key={`income-${month}`} className="p-3 text-right border-r last:border-r-0 dark:border-slate-700 font-semibold text-blue-700 dark:text-blue-400 text-xs">
                                {monthlyTotals.income[month] ? formatCurrency(monthlyTotals.income[month]) : "-"}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b dark:border-slate-700">
                            <td colSpan={2} className="p-3 font-semibold text-rose-700 dark:text-rose-400 border-r dark:border-slate-700 sticky-row-header left-0 z-20 bg-slate-100 dark:bg-slate-800 text-xs">
                              Total Dépenses
                            </td>
                            {months.map(month => (
                              <td key={`expense-${month}`} className="p-3 text-right border-r last:border-r-0 dark:border-slate-700 font-semibold text-rose-700 dark:text-rose-400 text-xs">
                                {monthlyTotals.expense[month] ? formatCurrency(monthlyTotals.expense[month]) : "-"}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td colSpan={2} className="p-3 font-bold text-slate-900 dark:text-white border-r dark:border-slate-700 sticky-row-header left-0 z-20 bg-slate-100 dark:bg-slate-800 text-xs">
                              Balance
                            </td>
                            {months.map(month => {
                              const balance = monthlyTotals.total[month];
                              const isPositive = balance >= 0;
                              
                              return (
                                <td 
                                  key={`balance-${month}`} 
                                  className={cn(
                                    "p-3 text-right border-r last:border-r-0 dark:border-slate-700 font-bold text-xs",
                                    isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                                  )}
                                >
                                  {balance !== 0 ? formatCurrency(Math.abs(balance)) : "-"}
                                  {isPositive ? " +" : " -"}
                                </td>
                              );
                            })}
                          </tr>
                        </tfoot>
                      </table>
                      </div>
                        </div>
                  <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          
          {/* Statistiques résumées */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 border-t dark:border-slate-700 text-slate-700 dark:text-slate-300 flex-shrink-0">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="text-sm font-medium">
                    <span className="text-blue-700 dark:text-blue-400">{totalCategories}</span> catégories, 
                    <span className="text-blue-700 dark:text-blue-400 ml-1">{totalSubcategories}</span> sous-catégories
              </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="text-blue-700 dark:text-blue-400 font-medium text-sm whitespace-nowrap">
                      Revenus: {formatCurrency(grandTotals.income)}
                    </span>
                    <span className="text-rose-700 dark:text-rose-400 font-medium text-sm whitespace-nowrap">
                      Dépenses: {formatCurrency(grandTotals.expense)}
                    </span>
                    <span className={cn(
                      "font-semibold text-sm whitespace-nowrap",
                      grandTotals.balance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                    )}>
                      Balance: {formatCurrency(Math.abs(grandTotals.balance))} {grandTotals.balance >= 0 ? "+" : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                  Aucun membre pour l&apos;instant
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
                  Explorez l&apos;application avec des données préchargées pour vous familiariser
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
          <div className="min-h-[350px] w-full flex flex-col items-center justify-center">
            <div className="animate-pulse w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Préparation de votre application...</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nous configurons tout pour vous. Cela ne prendra que quelques instants.
            </p>
          </div>
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
              onClick={() => {
                // Mettre à jour les préférences utilisateur avant de terminer l'onboarding
                updateUserPreferences();
                // Lancer l'événement de complétion de l'onboarding
                window.dispatchEvent(new CustomEvent('onboarding-complete'));
              }}
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

  // Fonction pour mettre à jour les préférences utilisateur quand l'onboarding est terminé
  const updateUserPreferences = async () => {
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Impossible de récupérer l'utilisateur actuel");
        return;
      }
      
      console.log("Mise à jour des préférences pour l'utilisateur:", user.id);
      
      // Vérifier d'abord si une entrée existe déjà pour cet utilisateur
      const { data: existingPrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let result;
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found, c'est normal si l'entrée n'existe pas encore
        console.error("Erreur lors de la vérification des préférences existantes:", fetchError);
        return;
      }
      
      if (existingPrefs) {
        // Mise à jour d'une entrée existante
        console.log("Mise à jour d'une entrée existante avec ID:", existingPrefs.id);
        result = await supabase
          .from('user_preferences')
          .update({
            completed_onboarding: true,
            theme: theme,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrefs.id);
      } else {
        // Création d'une nouvelle entrée
        console.log("Création d'une nouvelle entrée de préférences");
        result = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            completed_onboarding: true,
            theme: theme,
            language: 'fr' // Utiliser la valeur par défaut fournie dans le schéma
          });
      }
      
      if (result.error) {
        console.error("Erreur lors de la mise à jour des préférences:", result.error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de sauvegarder vos préférences. Veuillez réessayer."
        });
      } else {
        console.log("Préférences utilisateur mises à jour avec succès");
        toast({
          title: "Configuration terminée",
          description: "Vos préférences ont été sauvegardées avec succès."
        });
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour des préférences:", err);
    }
  };

  return (
    <>
      <OnboardingTour 
        steps={steps} 
        type="new-user" 
        onComplete={updateUserPreferences} // Appeler la fonction quand l'onboarding est terminé
      />
      {children}
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-[500px]",
          importStep === 3 && "sm:max-w-[800px]"
        )}>
          <DialogHeader>
            <DialogTitle>
              {importStep === 1 && "Importation de données"}
              {importStep === 2 && "Catégorisation des données"}
              {importStep === 3 && (importComplete ? "Importation terminée" : "Validation des données")}
            </DialogTitle>
            <DialogDescription>
              {importStep === 1 && "Sélectionnez l'année correspondant aux données que vous souhaitez importer."}
              {importStep === 2 && "Associez chaque sous-catégorie à une catégorie existante ou créez-en une nouvelle."}
              {importStep === 3 && !importComplete && "Vérifiez que les données sont correctes avant de finaliser l'importation."}
              {importStep === 3 && importComplete && "Vos données ont été importées avec succès."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {importStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {importFile?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {importFile?.size ? `${(importFile.size / 1024).toFixed(2)} KB` : ""}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Année des données
                  </label>
                  <Select value={importYear} onValueChange={handleImportYearSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez l'année" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2020, 2021, 2022, 2023, 2024].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {importError && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    {importError}
                  </div>
                )}
              </div>
            )}
            
            {importStep === 2 && (
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Sous-catégorie
                      </div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Catégorie
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto">
                    {subcategories
                      .filter((subcat: {name: string, category: string}) => !subcat.category) // Afficher uniquement les sous-catégories non mappées
                      .map((subcat, index) => (
                      <div 
                        key={index} 
                        className="px-4 py-2 border-b last:border-b-0 grid grid-cols-2 gap-4 items-center"
                      >
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {subcat.name}
                        </div>
                        <Select 
                          value={categoryMappings[subcat.name] || ""} 
                          onValueChange={(value) => handleCategoryMapping(subcat.name, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <ScrollArea className="h-[200px]">
                              <SelectGroup>
                                <SelectLabel>Catégories existantes</SelectLabel>
                                {categories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                              <SelectSeparator />
                              <CreateNewCategoryItem 
                                onSelect={(newCategory) => handleCategoryMapping(subcat.name, newCategory)} 
                              />
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {importStep === 3 && (
              <div className="space-y-6">
                {importComplete ? (
                  <div className="space-y-6">
                    <div className="rounded-lg p-6 border border-slate-200 dark:border-slate-700 relative firework-container">
                      {/* Feux d'artifice */}
                      {Array.from({ length: 10 }).map((_, index) => (
                        <div 
                          key={index}
                          className={`firework firework-${['green', 'blue', 'orange', 'pink', 'purple'][index % 5]}`}
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`
                          }}
                        />
                      ))}
                      
                      <div className="flex flex-col items-center text-center mb-4 relative z-10">
                        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
                          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                          Importation réussie !
                    </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Toutes vos données ont été importées avec succès dans votre compte.
                    </p>
                  </div>
                      
                      <div className="bg-white dark:bg-slate-800 rounded-md p-4 border border-slate-200 dark:border-slate-700 mb-4 relative z-10">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                          Résumé de l&apos;importation
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Année:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">{importYear}</span>
                      </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Transactions:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">{transactionsCount}</span>
                    </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Catégories:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {importedData ? Object.keys(importedData.categories).length : 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Sous-catégories:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {importedData ? Object.values(importedData.categories).reduce(
                                (count, cat) => count + Object.keys(cat.subcategories).length, 0
                              ) : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {importedData && <DataPreview data={importedData} year={importYear} />}
                  </>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            {importStep === 1 && (
              <Button 
                onClick={processExcelFile} 
                disabled={!importYear || importStatus === 'processing'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {importStatus === 'processing' ? (
                  <>
                    <span className="mr-2">Traitement...</span>
                    <span className="animate-spin">⟳</span>
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            )}
            
            {importStep === 2 && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setImportStep(1)}
                >
                  Retour
                </Button>
              <Button 
                onClick={finalizeImport} 
                disabled={importStatus === 'processing'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {importStatus === 'processing' ? (
                  <>
                      <span className="mr-2">Traitement...</span>
                    <span className="animate-spin">⟳</span>
                  </>
                ) : (
                    "Valider"
                )}
              </Button>
              </div>
            )}
            
            {importStep === 3 && !importComplete && (
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setImportStep(2)}
                >
                  Retour
                </Button>
                <Button 
                  onClick={createTransactionsFromImportedData} 
                  disabled={importStatus === 'processing'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {importStatus === 'processing' ? (
                    <>
                      <span className="mr-2">Finalisation...</span>
                      <span className="animate-spin">⟳</span>
                    </>
                  ) : (
                    "Finaliser l'importation"
                  )}
                </Button>
              </div>
            )}
            
            {importStep === 3 && importComplete && (
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                  className="flex-1"
                >
                  Terminer
                </Button>
                <Button 
                  onClick={resetImport}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Nouvelle importation
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 