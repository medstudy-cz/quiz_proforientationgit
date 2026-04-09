import "@/styles/globals.css";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import clsx from "clsx";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { QuizProviderFromRoute } from "@/components/QuizProviderFromRoute";
import Script from "next/script";
import { GAInit } from "@/components/GAInit";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: { icon: "/favicon.webp" },
};

type RootLayoutParams = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({ children, params }: RootLayoutParams) {
  const messages = await getMessages({ locale: params.locale });
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={params.locale}>
      <head>
      </head>
      <body
        className={clsx(
          "min-h-screen flex flex-col bg-background font-sans antialiased",
          fontSans.className
        )}
      >
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <QuizProviderFromRoute>
            {children}
            {gaId && <GAInit />}
            <CookieConsent />
          </QuizProviderFromRoute>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
