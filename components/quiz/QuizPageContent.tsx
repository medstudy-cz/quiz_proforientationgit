"use client";

import { Navbar } from "@/components/navbar";
import { StartScreen } from "@/components/quiz/StartScreen";
import { RoleSelection } from "@/components/quiz/RoleSelection";
import { EducationLevelSelection } from "@/components/quiz/EducationLevelSelection";
import { PersonalizationScreen } from "@/components/quiz/PersonalizationScreen";
import { QuizScreen } from "@/components/quiz/QuizScreen";
import { LeadCaptureForm } from "@/components/quiz/LeadCaptureForm";
import { ThankYouScreen } from "@/components/quiz/ThankYouScreen";
import { useQuiz } from "@/context/QuizContext";
import { trackEvent } from "@/utils/analytics";
import { sendEventToServer } from "@/utils/sendEvent";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { resolveStartScreenCopy } from "@/utils/resolveStartScreenCopy";
import type { StartScreenCopyKey } from "@/utils/resolveStartScreenCopy";

export function QuizPageContent() {
  const { step, setStep, role, level, setAnswers, answers, sanityQuiz } = useQuiz();
  const t = useTranslations("StartScreen");
  const locale = useLocale() || "uk";
  const startCopy = resolveStartScreenCopy(locale, sanityQuiz?.startScreen, (key: StartScreenCopyKey) =>
    t(key)
  );

  const backgroundClass = clsx(
    "min-h-screen h-auto flex flex-col",
    {
      "bg-[#0babff] bg-[url('/back.png')] bg-no-repeat bg-bottom bg-[length:150%] sm:bg-[length:100%]":
        role === "student",
      "bg-[#ddf7ff]": role === "parent",
      "bg-[#67dcfe]": !role,
    }
  );

  return (
    <div className={backgroundClass} style={{ minHeight: "100dvh" }}>
      {role === "student" && (
        <div className="absolute inset-0 h-full w-full pointer-events-none bg-gradient-to-b from-[#0babff] via-[#0babff]/80 to-transparent z-0" />
      )}

      <main className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        {step === "start" && (
          <div className="relative flex flex-col items-center">
            <h1
              className="relative z-20 mt-8 mb-6 px-4 text-center text-3xl font-bold"
              style={{ color: "#153060" }}
            >
              {startCopy.title}
            </h1>

            <div className="relative w-full max-w-md flex justify-center">
              <div className="absolute top-1/2 w-[365px] h-[150px] -translate-y-1/2 rounded-full bg-white opacity-60 blur-3xl z-0" />

              <img
                src="/main.png"
                alt="illustration"
                className="relative z-10 w-[250px] -mb-20"
              />
            </div>
          </div>
        )}

        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="bg-white p-4 sm:p-10 rounded-3xl shadow-xl w-full max-w-2xl text-center">
            {step === "start" && (
              <StartScreen
                copy={startCopy}
                onStart={() => {
                  setStep("role");
                  trackEvent("quiz_view", { step: "Start" });
                  sendEventToServer({ step: "Start" });
                }}
              />
            )}
            {step === "role" && <RoleSelection />}
            {step === "education" && role && <EducationLevelSelection />}
            {step === "personalization" && <PersonalizationScreen />}
            {step === "quiz" && role && level && <QuizScreen />}
            {step === "form" && (
              <LeadCaptureForm
                onSubmit={async (data) => {
                  setAnswers([
                    ...answers,
                    { question: "Form submitted", answer: JSON.stringify(data) },
                  ]);
                  setStep("thankyou");
                }}
              />
            )}
            {step === "thankyou" && <ThankYouScreen />}
          </div>
        </div>
      </main>
    </div>
  );
}
