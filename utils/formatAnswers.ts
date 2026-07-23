import type { Answer } from "@/context/QuizContext";
import type { Locale } from "@/dictionaries/promptsDictionary";

export function formatAnswers(answers: Answer[], _locale: Locale): string {
  return answers
    .map((a) => `Вопрос: "${a.question}"\nОтвет: "${a.answer}"`)
    .join("\n\n");
}
