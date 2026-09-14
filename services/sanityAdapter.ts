/**
 * Адаптер для преобразования данных из Sanity CMS
 * в формат, который ожидает существующее приложение
 */

import type {
  Quiz,
  Question as SanityQuestion,
  LocalizedText,
} from '@/sanity/lib/types'
import type { QuestionBankLanguage, Question } from '@/dictionaries/quizDictionary'

/**
 * Преобразует вопрос из Sanity в формат приложения
 */
function convertSanityQuestionToAppFormat(
  sanityQuestion: SanityQuestion,
  locale: 'en' | 'ru' | 'ua'
): Question {
  const isSimpleQuestion = typeof sanityQuestion.title === 'string'

  const questionText = isSimpleQuestion
    ? (sanityQuestion.title as string)
    : ((sanityQuestion.title as LocalizedText)[locale] ?? '')

  const question: Question = {
    type:
      sanityQuestion.type === 'text'
        ? 'open-ended'
        : sanityQuestion.type === 'multiple'
          ? 'multi-select'
          : 'multiple-choice',
    question: questionText,
  }

  if (sanityQuestion.type !== 'text' && sanityQuestion.answers) {
    question.options = sanityQuestion.answers.map((answer: any) => {
      const answerText =
        typeof answer.text === 'string'
          ? answer.text
          : ((answer.text as LocalizedText)[locale] ?? '')
      return answerText
    })
  }

  return question
}

function convertQuestionsList(
  questions: Array<SanityQuestion | { _ref: string; _type: string }> | undefined,
  locale: 'en' | 'ru' | 'ua'
): Question[] {
  if (!questions || questions.length === 0) {
    return []
  }

  const loadedQuestions = questions.filter(
    (q): q is SanityQuestion => '_id' in q && 'title' in q
  )

  return loadedQuestions.map((q) => convertSanityQuestionToAppFormat(q, locale))
}

/**
 * Преобразует квиз из Sanity в формат QuestionBank
 */
export function adaptSanityQuizToQuestionBank(
  quiz: Quiz,
  locale: 'en' | 'ru' | 'ua'
): QuestionBankLanguage {
  const { questions } = quiz

  return {
    student: {
      grade_11: convertQuestionsList(questions.student_grade_11?.[locale], locale),
      bachelor: convertQuestionsList(questions.student_bachelor?.[locale], locale),
    },
    parent: {
      all: convertQuestionsList(questions.parent?.[locale], locale),
    },
  }
}

/**
 * Получает AI промпт из квиза Sanity для конкретной роли.
 * Берём русский текст шаблона (если есть), иначе первый непустой язык.
 */
export function getSanityAIPrompt(
  quiz: Quiz,
  role: string,
  level: string,
  _locale: 'en' | 'ru' | 'ua'
): string {
  const promptKey =
    role === 'parent'
      ? 'parent'
      : (`student_${level}` as keyof typeof quiz.aiPrompts)

  const rolePrompt = quiz.aiPrompts[promptKey]
  if (!rolePrompt) {
    throw new Error(`Prompt not found for role "${role}" and level "${level}"`)
  }

  const text =
    (typeof rolePrompt.ru === 'string' && rolePrompt.ru.trim()) ||
    (typeof rolePrompt.ua === 'string' && rolePrompt.ua.trim()) ||
    (typeof rolePrompt.en === 'string' && rolePrompt.en.trim()) ||
    ''

  if (!text) {
    throw new Error(
      `Prompt text missing for role "${role}", level "${level}" (expected ru)`
    )
  }
  return text
}

export function formatAnswersForPrompt(
  questions: SanityQuestion[],
  answers: Array<{ question: string; answer: string }>,
  locale: 'en' | 'ru' | 'ua'
): string {
  return answers
    .map((ans, idx) => {
      const question = questions[idx]
      if (!question) return ''

      const isSimpleQuestion = typeof question.title === 'string'
      const questionText = isSimpleQuestion
        ? (question.title as string)
        : ((question.title as LocalizedText)[locale] ?? '')

      return `${questionText}: ${ans.answer}`
    })
    .filter(Boolean)
    .join('\n')
}
