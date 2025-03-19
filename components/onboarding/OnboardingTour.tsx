"use client"

import { useState, useEffect, useRef } from "react"
import { useOnboarding } from "@/hooks/useOnboarding"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { 
  ArrowLeft, Check, MenuIcon, Moon, Plus, ChevronLeft,
  Settings, Sun, Trash, Upload, X, Loader2, ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { Step, tour } from './common';
import { OnboardingGeneral } from './OnboardingGeneral';
import { OnboardingCategories } from './OnboardingCategories';
import { demoDataGenerator } from '@/services/demo-data/demo-data-generator';

interface OnboardingTourProps {
  type?: 'new-user' | 'feature-release'
  steps: {
    title: string
    description: string
    content: React.ReactNode
    showBackButton?: boolean
  }[]
  onComplete?: () => void
}

export function OnboardingTour({ type = 'new-user', steps, onComplete }: OnboardingTourProps) {
  const {
    isOnboardingActive,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding
  } = useOnboarding(type, steps.length)
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState(Step.OnboardingGeneral);
  const [initOption, setInitOption] = useState<'fromScratch' | 'demo' | 'import'>('fromScratch');
  const [loading, setLoading] = useState(false);
  const [processingDemo, setProcessingDemo] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Pour la communication avec les composants enfants
  useEffect(() => {
    const handleNextStep = () => nextStep();
    window.addEventListener('onboarding-next-step', handleNextStep);
    
    const handleCompleteOnboarding = () => {
      setIsClosing(true);
      
      setTimeout(() => {
        completeOnboarding();
        if (onComplete) {
          onComplete();
        }
      }, 400);
    };
    window.addEventListener('onboarding-complete', handleCompleteOnboarding);
    
    return () => {
      window.removeEventListener('onboarding-next-step', handleNextStep);
      window.removeEventListener('onboarding-complete', handleCompleteOnboarding);
    };
  }, [nextStep, completeOnboarding, onComplete]);
  
  // Effet de déplacement du gradient subtil
  useEffect(() => {
    if (!isOnboardingActive || !containerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Déplacement très subtil du gradient
      containerRef.current.style.setProperty('--mouse-x', `${x}%`);
      containerRef.current.style.setProperty('--mouse-y', `${y}%`);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOnboardingActive]);

  // Communiquer les changements d'option en dehors du composant
  useEffect(() => {
    // Émettre un événement global avec l'option sélectionnée
    window.dispatchEvent(new CustomEvent('init-option-change', {
      detail: { option: initOption }
    }));
    
    console.log("Option d'initialisation mise à jour:", initOption);
  }, [initOption]);

  // Fonction pour traiter le clic sur le bouton Continuer
  const handleContinueClick = async () => {
    console.log("handleContinueClick appelé avec initOption =", initOption);
    
    // Si nous sommes à l'étape d'initialisation des données (étape 3)
    if (currentStepData.title === "Initialisation de vos données") {
      // Vérifier explicitement quelle option est sélectionnée
      if (initOption === 'demo') {
        console.log("Option 'demo' détectée, génération des données en cours...");
        setProcessingDemo(true);
        try {
          // Générer des données de démonstration
          const success = await demoDataGenerator.generateDemoData();
          if (!success) {
            console.error("Échec de la génération des données de démonstration");
          } else {
            console.log("Données de démonstration générées avec succès");
          }
        } catch (error) {
          console.error("Erreur lors de la génération des données de démonstration:", error);
        } finally {
          setProcessingDemo(false);
          
          // Passer à l'étape suivante
          console.log("Passage à l'étape suivante après génération de données");
          nextStep();
        }
      } else if (initOption === 'fromScratch') {
        console.log("Option 'fromScratch' détectée, passage direct à l'étape suivante");
        // Passer directement à l'étape suivante sans générer de données
        nextStep();
      } else {
        console.log("Option non reconnue:", initOption, "passage à l'étape suivante");
        nextStep();
      }
      return;
    }
    
    // Pour toutes les autres étapes, simplement passer à l'étape suivante
    console.log("Bouton 'Continuer' cliqué sur une étape standard, passage à l'étape suivante");
    nextStep();
  };

  // Ajout d'un useEffect pour surveiller les changements d'option dans les composants enfants
  useEffect(() => {
    const handleOptionChange = (e: CustomEvent<{ option: string }>) => {
      if (e.detail && e.detail.option) {
        console.log("Option changée depuis un enfant:", e.detail.option);
        setInitOption(e.detail.option as 'fromScratch' | 'demo' | 'import');
      }
    };
    
    window.addEventListener('init-option-change', handleOptionChange as EventListener);
    
    return () => {
      window.removeEventListener('init-option-change', handleOptionChange as EventListener);
    };
  }, []);

  // Ne fait que changer le thème sans passer à l'étape suivante
  const applyTheme = (selectedTheme: 'light' | 'dark') => {
    // Créer une couche de transition temporaire pour masquer toute transparence
    const transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'theme-transition-overlay';
    transitionOverlay.style.position = 'fixed';
    transitionOverlay.style.inset = '0';
    transitionOverlay.style.backgroundColor = selectedTheme === 'dark' ? '#0f172a' : '#ffffff';
    transitionOverlay.style.zIndex = '9999';
    transitionOverlay.style.opacity = '1';
    transitionOverlay.style.transition = 'opacity 300ms ease-out';
    document.body.appendChild(transitionOverlay);
    
    // D'abord mettre à jour l'état local
    setTheme(selectedTheme);
    
    // Sauvegarder la préférence de l'utilisateur
    localStorage.setItem('user-theme', selectedTheme);
    
    // Émettre un événement pour informer les autres composants du changement
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { theme: selectedTheme } 
    }));
    
    // Appliquer le thème au document immédiatement
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Supprimer la couche de transition après un délai
    setTimeout(() => {
      transitionOverlay.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(transitionOverlay)) {
          document.body.removeChild(transitionOverlay);
        }
      }, 300); // Durée de la transition d'opacité
    }, 100); // Court délai avant de commencer à faire disparaître l'overlay
  };

  // Ajouter un effet pour s'assurer que le thème est correctement appliqué à toutes les étapes
  useEffect(() => {
    // Récupérer le thème depuis localStorage au chargement
    const savedTheme = localStorage.getItem('user-theme') as 'light' | 'dark';
    if (savedTheme) {
      console.log("Thème récupéré depuis localStorage:", savedTheme);
      setTheme(savedTheme);
      
      // Appliquer le thème au document
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  if (!isOnboardingActive) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isThemeStep = currentStep === 1;
  const showBackButton = currentStepData.showBackButton && currentStep > 0;

  // Variantes d'animation pour les transitions entre étapes
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-800 ease-in-out",
        isClosing ? "opacity-0 transform scale-110" : "opacity-100 scale-100",
        theme === 'dark' 
          ? "bg-slate-900 text-white" 
          : "bg-gradient-to-b from-slate-50 to-white"
      )}
      style={theme === 'light' ? {
        background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(14, 165, 233, 0.03) 0%, rgba(255, 255, 255, 0) 70%), linear-gradient(to bottom, #f8fafc, #ffffff)`,
        transitionDuration: isClosing ? '800ms' : '300ms',
        backdropFilter: 'blur(12px)'
      } : {
        background: `#0f172a`, /* Fond solide pour le mode sombre */
        transitionDuration: isClosing ? '800ms' : '300ms',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Bouton retour en haut à gauche si nécessaire */}
      {showBackButton && (
        <button 
          onClick={prevStep}
          className={cn(
            "absolute top-6 left-6 text-sm flex items-center transition-colors",
            theme === 'dark' ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour
        </button>
      )}
      
      {/* Contenu principal centré avec animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
          className="max-w-md w-full mx-auto px-6 flex flex-col items-center"
        >
          {isFirstStep ? (
            // Structure spéciale pour l'étape 0 avec icône au-dessus du titre
            <>
              {/* Icône en premier */}
              {currentStepData.content}
              
              {/* Titre et sous-titre */}
              <div className="text-center">
                <h1 className={cn(
                  "text-3xl sm:text-4xl font-medium mb-3",
                  theme === 'dark' ? "text-white" : "text-slate-800"
                )} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: '-0.03em' }}>
                  {currentStepData.title}
                </h1>
                <p className={cn(
                  "text-base mx-auto",
                  theme === 'dark' ? "text-slate-300" : "text-slate-500"
                )} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: '1.6', maxWidth: '90%' }}>
                  {currentStepData.description}
                </p>
              </div>
              
              {/* Bouton d'action */}
              <div className="flex flex-col items-center mt-8">
                <Button
                  onClick={nextStep}
                  className={cn(
                    "flex items-center min-w-[160px] h-[48px] font-medium",
                    theme === 'dark' 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600"
                  )}
                >
                  Découvrir MoneyApp
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <p className={cn(
                  "text-xs mt-2",
                  theme === 'dark' ? "text-slate-400" : "text-slate-500"
                )}>
                  Nous sommes là pour vous accompagner, étape par étape.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Titre et sous-titre toujours en première position pour les autres étapes */}
              <div className="text-center mb-8 w-full">
                <h1 className={cn(
                  "text-3xl sm:text-4xl font-medium mb-3",
                  theme === 'dark' ? "text-white" : "text-slate-800"
                )} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: '-0.03em' }}>
                  {currentStepData.title}
                </h1>
                <p className={cn(
                  "text-base mx-auto",
                  theme === 'dark' ? "text-slate-300" : "text-slate-500",
                  currentStepData.title.includes("Préparation de votre application") ? "animate-pulse" : ""
                )} style={{ 
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", 
                  lineHeight: '1.6', 
                  maxWidth: '90%',
                  animationDuration: currentStepData.title.includes("Préparation de votre application") ? '2s' : '1s'
                }}>
                  {currentStepData.description}
                </p>
              </div>
              
              {/* Contenu spécifique à l'étape */}
              <div className="w-full">
                {currentStep === 1 ? (
                  // Étape du choix de thème
                  <>
                    {currentStepData.content}
                    
                    {/* Thème selectors */}
                    <div className="flex items-center justify-center gap-8 my-8">
                      {/* Option thème clair */}
                      <div 
                        className="relative cursor-pointer transition-transform transform hover:scale-105"
                        onClick={() => applyTheme('light')}
                      >
                        <div className={cn(
                          "w-48 h-32 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden",
                          theme === 'light' ? "bg-slate-50" : ""
                        )}>
                          <div className="h-6 bg-slate-100 border-b border-slate-200 flex items-center px-3">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          </div>
                          <div className="p-3">
                            <div className="w-full h-2 bg-slate-100 rounded mb-2"></div>
                            <div className="w-2/3 h-2 bg-slate-100 rounded mb-4"></div>
                            <div className="flex space-x-2">
                              <div className="w-8 h-8 rounded bg-slate-100"></div>
                              <div className="w-8 h-8 rounded bg-slate-100"></div>
                            </div>
                          </div>
                        </div>
                        <p className={cn(
                          "text-center mt-2 font-medium",
                          theme === 'dark' ? "text-white" : "text-slate-700"
                        )}>Clair</p>
                        {theme === 'light' && (
                          <div className="absolute inset-0 -m-2 bg-blue-100/50 rounded-xl -z-10"></div>
                        )}
                      </div>
                      
                      {/* Option thème sombre */}
                      <div 
                        className="relative cursor-pointer transition-transform transform hover:scale-105"
                        onClick={() => applyTheme('dark')}
                      >
                        <div className="w-48 h-32 bg-slate-800 border border-slate-700 rounded-lg shadow-sm overflow-hidden">
                          <div className="h-6 bg-slate-700 border-b border-slate-600 flex items-center px-3">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          </div>
                          <div className="p-3">
                            <div className="w-full h-2 bg-slate-600 rounded mb-2"></div>
                            <div className="w-2/3 h-2 bg-slate-600 rounded mb-4"></div>
                            <div className="flex space-x-2">
                              <div className="w-8 h-8 rounded bg-slate-600"></div>
                              <div className="w-8 h-8 rounded bg-slate-600"></div>
                            </div>
                          </div>
                        </div>
                        <p className={cn(
                          "text-center mt-2 font-medium",
                          theme === 'dark' ? "text-white" : "text-slate-700"
                        )}>Sombre</p>
                        {theme === 'dark' && (
                          <div className="absolute inset-0 -m-2 bg-blue-400/20 rounded-xl -z-10"></div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bouton continuer pour l'étape du thème */}
                    <div className="flex flex-col items-center">
                      <Button
                        onClick={currentStepData.title === "Initialisation de vos données" ? handleContinueClick : nextStep}
                        className={cn(
                          "flex items-center min-w-[160px] h-[48px] font-medium",
                          theme === 'dark' 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600"
                        )}
                      >
                        {processingDemo && currentStepData.title === "Initialisation de vos données" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            Continuer
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      
                      <p className={cn(
                        "text-xs mt-2",
                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                      )}>
                        Nous sommes là pour vous accompagner, étape par étape.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {currentStepData.content}
                    
                    {/* Bouton d'action principal pour les autres étapes */}
                    {currentStep !== 2 && 
                     currentStep !== steps.length - 1 && 
                     !currentStepData.title.includes("Préparation de votre application") && (
                      <div className="flex flex-col items-center mt-8">
                        <Button
                          onClick={currentStepData.title === "Initialisation de vos données" ? handleContinueClick : nextStep}
                          className={cn(
                            "flex items-center min-w-[160px] h-[48px] font-medium",
                            theme === 'dark' 
                              ? "bg-blue-600 hover:bg-blue-700" 
                              : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600"
                          )}
                        >
                          {processingDemo && currentStepData.title === "Initialisation de vos données" ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Traitement...
                            </>
                          ) : (
                            <>
                              Continuer
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        
                        <p className={cn(
                          "text-xs mt-2",
                          theme === 'dark' ? "text-slate-400" : "text-slate-500"
                        )}>
                          Nous sommes là pour vous accompagner, étape par étape.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Indicateurs de progression (points) avec animation */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center space-x-2">
        {Array.from({ length: steps.length }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ 
              scale: index === currentStep ? 1.1 : 1,
              opacity: index === currentStep ? 1 : 0.7
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              "rounded-full transition-all duration-300",
              index === currentStep
                ? theme === 'dark' ? "bg-blue-400 w-1.5 h-1.5" : "bg-blue-500 w-1.5 h-1.5"
                : theme === 'dark' ? "bg-slate-600 w-1 h-1" : "bg-slate-200 w-1 h-1"
            )}
          />
        ))}
      </div>
    </div>
  );
} 