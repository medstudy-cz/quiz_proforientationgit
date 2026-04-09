import type { QuizStartScreen } from "@/sanity/lib/types";

export type StartScreenCopyKey =
  | "title"
  | "description"
  | "button"
  | "footer"
  | "feature1"
  | "feature2"
  | "feature3";

export type ResolvedStartScreenCopy = Record<StartScreenCopyKey, string>;

type TranslateFn = (key: StartScreenCopyKey) => string;

/**
 * Sanity startScreen overrides per field (en/ru/uk); falls back to next-intl t().
 */
export function resolveStartScreenCopy(
  locale: string,
  startScreen: QuizStartScreen | undefined,
  t: TranslateFn
): ResolvedStartScreenCopy {
  const loc = (locale === "en" || locale === "ru" || locale === "uk" ? locale : "uk") as
    | "en"
    | "ru"
    | "uk";

  const pick = (field: StartScreenCopyKey): string => {
    const block = startScreen?.[field];
    const fromSanity = block?.[loc]?.trim();
    if (fromSanity) return fromSanity;
    return t(field);
  };

  return {
    title: pick("title"),
    description: pick("description"),
    button: pick("button"),
    footer: pick("footer"),
    feature1: pick("feature1"),
    feature2: pick("feature2"),
    feature3: pick("feature3"),
  };
}
