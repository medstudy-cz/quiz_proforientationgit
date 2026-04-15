"use client";
import React, { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/utils/analytics";
import { sendEventToServer } from "@/utils/sendEvent";

export function ThankYouScreen() {
  const t = useTranslations("ThankYouScreen");
  const locale = useLocale() || "ua";
  const fullProgramsUrl = `https://medstudy.cz/${locale}/products/fullprograms`;

  useEffect(() => {
    const payload = { source: "thank_you_page" };
    trackEvent("Generate_lead", payload);
    sendEventToServer(payload as any);
  }, []);

  return (
    <div className="quiz-container mb-10 mt-10 text-center text-[#153060]">
      <h2 className="mb-4 text-2xl font-bold">{t("title")}</h2>
      <p className="text-base leading-relaxed">
        {t("message1")}
        <br />
        <br />
        {t("message2")}{" "}
        <a
          href={fullProgramsUrl}
          className="font-bold underline text-[#153060] hover:text-[#153060]/80 transition-colors"
        >
          {t("linkText")}
        </a>.

      </p>
    </div>

  );
}
