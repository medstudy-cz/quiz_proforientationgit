import { questions } from "@/dictionaries/quizDictionary";
import type { QuestionBankLanguage } from "@/dictionaries/quizDictionary";
import { getQuizBySlug, getQuizzes } from "@/sanity/lib/api";
import type { Quiz } from "@/sanity/lib/types";
import { adaptSanityQuizToQuestionBank } from "./sanityAdapter";

export type QuizSource = "local" | "sanity";

/** Slug из URL или первый активный квиз в Sanity */
export async function resolveSanityQuizSlug(sanitySlug?: string): Promise<string> {
  if (sanitySlug?.trim()) return sanitySlug.trim();

  const quizzes = await getQuizzes();
  if (quizzes.length === 0) {
    throw new Error("No active quizzes found in Sanity");
  }
  const first = quizzes[0].slug?.current;
  if (!first) {
    throw new Error("Active quiz has no slug");
  }
  return first;
}

/** Одна загрузка квиза из Sanity + адаптация вопросов */
export async function fetchActiveSanityQuiz(
  lang: string,
  sanitySlug?: string
): Promise<{ quiz: Quiz; data: QuestionBankLanguage }> {
  const locale = lang as "en" | "ru" | "uk";
  const slug = await resolveSanityQuizSlug(sanitySlug);
  const quiz = await getQuizBySlug(slug);

  if (!quiz) {
    throw new Error(`Quiz with slug "${slug}" not found in Sanity`);
  }
  if (!quiz.isActive) {
    throw new Error(`Quiz "${slug}" is not active`);
  }

  const data = adaptSanityQuizToQuestionBank(quiz, locale);
  return { quiz, data };
}

/**
 * Получает вопросы из выбранного источника
 * @param source - источник данных: "local" или "sanity"
 * @param lang - язык
 * @param sanitySlug - slug квиза в Sanity (требуется для source="sanity")
 */
export async function getQuestions(
  source: QuizSource = "local",
  lang: string = "uk",
  sanitySlug?: string
): Promise<QuestionBankLanguage> {
  const locale = lang as 'en' | 'ru' | 'uk';

  // Загрузка из локального файла
  if (source === "local") {
    if (!(questions as any)[lang]) {
      throw new Error(`Questions for language "${lang}" not found`);
    }
    return (questions as any)[lang];
  }

  // Загрузка из Sanity CMS
  if (source === "sanity") {
    console.log("🔍 getQuestions: Loading from Sanity", { sanitySlug, locale });
    const { quiz, data } = await fetchActiveSanityQuiz(lang, sanitySlug);
    console.log("📦 Quiz loaded:", {
      id: quiz._id,
      slug: quiz.slug?.current,
      isActive: quiz.isActive,
      questionsCount: Object.keys(quiz.questions || {}).length,
    });
    console.log("✅ Adapted questions:", data);
    return data;
  }

  throw new Error("Unsupported source");
}

/**
 * Получает полные данные квиза из Sanity
 */
export async function getSanityQuiz(slug: string) {
  return getQuizBySlug(slug);
}