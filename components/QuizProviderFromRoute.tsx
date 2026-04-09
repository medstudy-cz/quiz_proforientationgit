"use client";

import { usePathname } from "next/navigation";
import { QuizProvider } from "@/context/QuizContext";

/**
 * Передаёт в Sanity slug квиза из URL: /{locale}/{quizSlug}.
 * Если в пути только локаль (например /ru), slug не задаётся — quizService подтянет первый активный квиз.
 */
export function QuizProviderFromRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const sanitySlug = segments.length >= 2 ? segments[1] : undefined;
  const providerKey = sanitySlug ?? "__default__";

  return (
    <QuizProvider key={providerKey} sanitySlug={sanitySlug}>
      {children}
    </QuizProvider>
  );
}
