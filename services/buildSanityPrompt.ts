import "server-only";
import type { Quiz } from "@/sanity/lib/types";
import type { Answer } from "@/context/QuizContext";
import { getSanityAIPrompt } from "@/services/sanityAdapter";
import {
  formatUniversitiesForPrompt,
  layerInstruction,
  type UniversityLayer,
} from "@/utils/formatUniversitiesForPrompt";
import { reportLanguageInstruction } from "@/dictionaries/promptsDictionary";

/**
 * Подставляет данные в Sanity-промпт и добавляет JSON-базу вузов (server-only).
 */
export async function buildSanityPrompt(
  quiz: Quiz,
  role: string,
  level: string,
  answers: Answer[],
  locale: "en" | "ru" | "ua",
  _useSanityInstitutions: boolean = true,
  additionalData?: Record<string, string>,
  universityLayer: UniversityLayer = 1
): Promise<string> {
  let prompt = getSanityAIPrompt(quiz, role, level, locale);

  const openAnswers = answers
    .filter((a) => a.answer)
    .map((a) => a.answer)
    .join("; ");

  const universitiesList = formatUniversitiesForPrompt(universityLayer);

  prompt = prompt
    .replace(/{openAnswers}/g, openAnswers)
    .replace(/{topDirection}/g, "")
    .replace(/{languagePreference}/g, locale);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{${key}}`, "g"), value);
    });
  }

  return `
${prompt}

---

Вот ответы пользователя:
${answers.map((a) => `${a.question}: ${a.answer}`).filter(Boolean).join("\n")}

${layerInstruction(universityLayer)}

Университеты и факультеты:
${universitiesList}

${reportLanguageInstruction}
`.trim();
}
