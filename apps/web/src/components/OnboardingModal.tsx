import React, { useState, useEffect } from "react";
import { usePreferences } from "../store/usePreferences";
import { Button } from "../components/button";

export function OnboardingModal() {
  const { hasCompletedOnboarding, completeOnboarding } = usePreferences();
  const [step, setStep] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      setShowModal(true);
    }
  }, [hasCompletedOnboarding]);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleSkip = () => {
    setShowModal(false);
  };

  const handleComplete = () => {
    completeOnboarding();
    setShowModal(false);
  };

  if (!showModal) {
    return null;
  }

  const steps = [
    {
      title: "Bienvenue sur Influence!",
      description:
        "Découvrez comment gérer et optimiser votre présence sur les réseaux sociaux.",
      buttonText: "Commencer",
      action: handleNext,
    },
    {
      title: "Étape 1: Connectez vos comptes API",
      description:
        "Configurez vos clés API pour YouTube, Instagram, TikTok, Facebook et X.",
      buttonText: "Tester les APIs (à implémenter)",
      action: () => alert("API Test functionality to be implemented."),
    },
    {
      title: "Étape 2: Ajoutez vos comptes sociaux",
      description:
        "Liez vos profils pour commencer à analyser vos performances et publier.",
      buttonText: "Ajouter des comptes (à implémenter)",
      action: () => alert("Add accounts functionality to be implemented."),
    },
    {
      title: "Étape 3: Créez votre premier post",
      description:
        "Planifiez et publiez du contenu sur plusieurs plateformes simultanément.",
      buttonText: "Publier (à implémenter)",
      action: () => alert("First post functionality to be implemented."),
    },
    {
      title: "Onboarding terminé!",
      description:
        "Vous êtes maintenant prêt à utiliser Influence. Bonne gestion!",
      buttonText: "Fermer",
      action: handleComplete,
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-auto dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {currentStep.title}
        </h2>
        <p className="text-gray-700 mb-6 dark:text-gray-300">
          {currentStep.description}
        </p>
        <div className="flex justify-between">
          <Button onClick={currentStep.action ? currentStep.action : handleNext}>
            {currentStep.buttonText}
          </Button>

          {step < steps.length - 1 && (
            <Button
              className="bg-transparent hover:bg-gray-100 text-gray-700 border"
              onClick={handleSkip}
            >
              Passer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
