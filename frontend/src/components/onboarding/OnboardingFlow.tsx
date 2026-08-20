"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  getGreatChoiceMessage,
  LANGUAGE_STEP_MESSAGE,
  LANGUAGE_STEP_TITLE,
  ONBOARDING_LANGUAGES,
  ONBOARDING_TOTAL_STEPS,
  OnboardingLanguageOption,
  WELCOME_MESSAGES,
  userCanAccessLearningPath,
} from "@/lib/onboarding";
import OnboardingLayout from "./OnboardingLayout";
import DuoMascot from "./DuoMascot";
import SpeechBubble from "./SpeechBubble";
import ContinueButton from "./ContinueButton";
import ProgressHeader from "./ProgressHeader";
import LanguageCard from "./LanguageCard";
import LoadingScreen from "./LoadingScreen";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export const OnboardingFlow: React.FC = () => {
  const router = useSafeRouter();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<OnboardingLanguageOption | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.getUserProfile("me");
        if (cancelled) return;
        if (userCanAccessLearningPath(profile)) {
          if (router.isReady) router.replace("/");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Could not connect to the server. Make sure the backend is running.");
        }
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.replace]);

  const goNext = useCallback(() => {
    setError(null);
    setStep((s) => (s < 5 ? ((s + 1) as OnboardingStep) : s));
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as OnboardingStep) : s));
  }, []);

  const handleSelectLanguage = useCallback((language: OnboardingLanguageOption) => {
    if (!language.available || !language.courseId) return;
    setSelectedLanguage(language);
    setError(null);
  }, []);

  const persistAndFinish = useCallback(async () => {
    if (!selectedLanguage?.courseId) return;

    setError(null);
    try {
      const result = await api.completeOnboarding(
        selectedLanguage.courseId,
        selectedLanguage.id
      );
      if (!result.success) {
        throw new Error("Could not save your progress. Please try again.");
      }

      const profile = await api.getUserProfile("me");
      if (!profile.onboarding_completed || !profile.active_course_id) {
        throw new Error(
          "Onboarding was not saved. Please refresh and try again."
        );
      }

      if (router.isReady) router.replace("/");
    } catch (err) {
      console.error(err);
      setShowLoading(false);
      setStep(4);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }, [selectedLanguage, router]);

  const startLoadingPhase = useCallback(() => {
    setShowLoading(true);
  }, []);

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-[#131F24] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green" />
        <p className="text-slate-400 font-bold font-nunito">Loading...</p>
      </div>
    );
  }

  if (showLoading) {
    return <LoadingScreen onComplete={persistAndFinish} minDurationMs={2800} />;
  }

  /* Steps 1–2: Welcome screens */
  if (step === 1 || step === 2) {
    const message = WELCOME_MESSAGES[step - 1];
    return (
      <OnboardingLayout stepKey={step} footer={<ContinueButton onClick={goNext} />}>
        <div className="flex flex-col items-center gap-10 sm:gap-12 w-full">
          <DuoMascot size={220} className="sm:scale-110" />
          <SpeechBubble text={message} className="max-w-[340px] sm:max-w-[400px]" />
          {error && (
            <p className="text-sm font-bold text-rose-400 text-center max-w-md">{error}</p>
          )}
        </div>
      </OnboardingLayout>
    );
  }

  /* Step 3: Language selection */
  if (step === 3) {
    return (
      <OnboardingLayout
        stepKey={step}
        header={
          <ProgressHeader step={step} totalSteps={ONBOARDING_TOTAL_STEPS} onBack={goBack} />
        }
        footer={
          <ContinueButton
            onClick={goNext}
            disabled={!selectedLanguage?.available}
            label="Continue"
          />
        }
      >
        <div className="flex flex-col items-center gap-8 sm:gap-10 w-full">
          <div className="flex flex-col items-center gap-6 w-full">
            <DuoMascot size={140} />
            <div className="w-full max-w-[400px] space-y-2">
              <h2 className="text-center text-sm font-black uppercase tracking-widest text-slate-500">
                {LANGUAGE_STEP_TITLE}
              </h2>
              <SpeechBubble
                text={LANGUAGE_STEP_MESSAGE}
                delay={0.05}
                size="md"
                className="max-w-full"
              />
            </div>
          </div>

          <div className="w-full max-w-[420px] grid grid-cols-2 gap-3 sm:gap-4">
            {ONBOARDING_LANGUAGES.map((lang, index) => (
              <LanguageCard
                key={lang.id}
                language={lang}
                selected={selectedLanguage?.id === lang.id}
                onSelect={handleSelectLanguage}
                index={index}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm font-bold text-rose-400 text-center max-w-md">{error}</p>
          )}
        </div>
      </OnboardingLayout>
    );
  }

  /* Step 4: Great choice confirmation */
  if (step === 4) {
    const languageName = selectedLanguage?.name ?? "your language";
    return (
      <OnboardingLayout
        stepKey={step}
        header={
          <ProgressHeader step={step} totalSteps={ONBOARDING_TOTAL_STEPS} onBack={goBack} />
        }
        footer={<ContinueButton onClick={startLoadingPhase} label="Continue" />}
      >
        <div className="flex flex-col items-center gap-10 sm:gap-12 w-full">
          <DuoMascot size={200} />
          <div className="flex flex-col items-center gap-4 w-full max-w-[400px]">
            <SpeechBubble text="Great choice!" className="max-w-full" />
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="text-xl sm:text-2xl font-extrabold text-brand-green text-center leading-snug"
            >
              {getGreatChoiceMessage(languageName)}
            </motion.p>
            {selectedLanguage?.themeText && (
              <p className="text-sm font-semibold text-slate-400 text-center">
                {selectedLanguage.themeText}
              </p>
            )}
          </div>
          {error && (
            <p className="text-sm font-bold text-rose-400 text-center max-w-md">{error}</p>
          )}
        </div>
      </OnboardingLayout>
    );
  }

  /* Step 5 triggers loading — fallback if reached directly */
  return (
    <OnboardingLayout stepKey={step} footer={<ContinueButton onClick={startLoadingPhase} />}>
      <DuoMascot size={180} />
    </OnboardingLayout>
  );
};

export default OnboardingFlow;
