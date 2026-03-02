
import { questions } from "@/dictionaries/quizDictionary";
import type { QuestionBank, QuestionBankLanguage } from "@/dictionaries/quizDictionary";
import { getQuizBySlug } from "@/sanity/lib/api";
import { adaptSanityQuizToQuestionBank } from "./sanityAdapter";

export type QuizSource = "local" | "sanity";

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
    console.log('🔍 getQuestions: Loading from Sanity', { sanitySlug, locale });
    let quiz;

    if (sanitySlug) {
      // Если slug указан - загружаем конкретный квиз
      console.log('📦 Loading quiz by slug:', sanitySlug);
      quiz = await getQuizBySlug(sanitySlug);
      console.log('📦 Quiz loaded:', quiz ? 'success' : 'failed', quiz ? { 
        id: quiz._id, 
        slug: quiz.slug?.current,
        isActive: quiz.isActive,
        questionsCount: Object.keys(quiz.questions || {}).length
      } : null);

      if (!quiz) {
        throw new Error(`Quiz with slug "${sanitySlug}" not found in Sanity`);
      }

      if (!quiz.isActive) {
        throw new Error(`Quiz "${sanitySlug}" is not active`);
      }
    } else {
      // Если slug не указан - берем первый активный квиз
      console.log('📦 Loading first active quiz');
      const { getQuizzes } = await import("@/sanity/lib/api");
      const quizzes = await getQuizzes();
      console.log('📦 Found quizzes:', quizzes.length, quizzes.map(q => ({ slug: q.slug.current, isActive: q.isActive })));

      if (quizzes.length === 0) {
        throw new Error("No active quizzes found in Sanity");
      }

      // Берем первый квиз и загружаем его полностью
      const firstQuizSlug = quizzes[0].slug.current;
      console.log('📦 Loading quiz by slug:', firstQuizSlug);
      quiz = await getQuizBySlug(firstQuizSlug);
      console.log('📦 Quiz loaded:', quiz ? 'success' : 'failed', quiz ? { 
        id: quiz._id, 
        slug: quiz.slug?.current,
        isActive: quiz.isActive,
        questionsCount: Object.keys(quiz.questions || {}).length
      } : null);

      if (!quiz) {
        throw new Error("Failed to load quiz from Sanity");
      }
    }

    const adapted = adaptSanityQuizToQuestionBank(quiz, locale);
    console.log('✅ Adapted questions:', adapted);
    return adapted;
  }

  throw new Error("Unsupported source");
}

/**
 * Получает полные данные квиза из Sanity
 */
export async function getSanityQuiz(slug: string) {
  return getQuizBySlug(slug);
}