// apps/web/src/components/OnboardingModal.tsx
import React, { useState } from "react";
import { usePreferences } from "../store/usePreferences";
import { useTranslation } from "react-i18next";
import { Button } from "@influence/ui"; // Assuming you have a Button component from your UI package

interface OnboardingStepProps {
  title: string;
  description: string;
  imageUrl?: string; // Optional image for the step
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  title,
  description,
  imageUrl,
}) => (
  <div className="flex flex-col items-center text-center p-4">
    {imageUrl && (
      <img
        src={imageUrl}
        alt={title}
        className="mb-4 w-32 h-32 object-contain"
      />
    )}
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-700 dark:text-gray-300">{description}</p>
  </div>
);

const OnboardingModal: React.FC = () => {
  const { preferences, completeOnboarding } = usePreferences();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t("onboarding_step_1_title"),
      description: t("onboarding_step_1_description"),
      // imageUrl: '/path/to/connect_accounts_image.png', // Add relevant images
    },
    {
      title: t("onboarding_step_2_title"),
      description: t("onboarding_step_2_description"),
      // imageUrl: '/path/to/create_post_image.png',
    },
    {
      title: t("onboarding_step_3_title"),
      description: t("onboarding_step_3_description"),
      // imageUrl: '/path/to/track_performance_image.png',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  if (preferences.hasCompletedOnboarding) {
    return null; // Don't render if onboarding is complete
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {t("skip_onboarding")}
        </button>

        <OnboardingStep {...currentStepData} />

        <div className="mt-6 flex justify-between">
          {currentStep > 0 && (
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="secondary"
            >
              {t("previous")}
            </Button>
          )}
          <div className="flex-grow" />
          <Button onClick={handleNext}>
            {currentStep < steps.length - 1 ? t("next") : t("finish")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
