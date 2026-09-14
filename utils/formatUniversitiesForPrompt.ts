import "server-only";
import fs from "fs";
import path from "path";

export type UniversityLayer = 1 | 2;

/** Layer 1: detailed admission cards from curated tables */
export type UniversityLayer1Entry = {
  id: string;
  facultyAndUni: string;
  universityShort?: string | null;
  facultyShort?: string | null;
  city?: string | null;
  specialty: string;
  degree?: string | null;
  deadlines?: string | null;
  exams?: string | null;
  documents?: string | null;
  nostrification?: string | null;
  languageRequirement?: string | null;
  price?: string | null;
  admissionThreshold?: string | null;
  comments?: string | null;
  summary?: string | null;
};

export type UniversityLayer2Entry = {
  facultyAndUni: string;
  specialty: string;
  deadlines?: string;
  exams?: string;
  documents?: string;
  nostrification?: string;
  languageRequirement?: string;
  price?: string;
};

type UniversitiesLayer1File = {
  universities: UniversityLayer1Entry[];
};

const EMPTY_MARKERS = new Set([
  "",
  "не указано",
  "не вказано",
  "n/a",
  "none",
  "-",
]);

function isUseful(value?: string | null): value is string {
  if (!value) return false;
  return !EMPTY_MARKERS.has(value.trim().toLowerCase());
}

function readDataJson<T>(fileName: string): T {
  const filePath = path.join(process.cwd(), "data", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

let cachedLayer1: string | null = null;
let cachedLayer2: string | null = null;

function formatLayer1(): string {
  if (cachedLayer1) return cachedLayer1;

  const { universities } = readDataJson<UniversitiesLayer1File>("universities.json");

  if (!universities?.length) {
    cachedLayer1 = "(слой 1 пуст — заполните data/universities.json)";
    return cachedLayer1;
  }

  cachedLayer1 = universities
    .map((e) => {
      const loc = e.city ? ` (${e.city})` : "";
      const lines = [
        `### ${e.facultyAndUni}${loc}`,
        `Специальность: ${e.specialty}`,
      ];

      if (isUseful(e.summary)) lines.push(`Кратко: ${e.summary}`);
      if (isUseful(e.exams)) lines.push(`Вступительные: ${e.exams}`);
      if (isUseful(e.deadlines)) lines.push(`Сроки: ${e.deadlines}`);
      if (isUseful(e.admissionThreshold)) {
        lines.push(`Порог: ${e.admissionThreshold}`);
      }
      if (isUseful(e.languageRequirement)) {
        lines.push(`Язык: ${e.languageRequirement}`);
      }
      if (isUseful(e.documents)) lines.push(`Документы: ${e.documents}`);
      if (isUseful(e.nostrification)) {
        lines.push(`Нострификация: ${e.nostrification}`);
      }
      if (isUseful(e.price)) lines.push(`Стоимость/заявка: ${e.price}`);
      if (isUseful(e.comments)) lines.push(`Комментарий: ${e.comments}`);

      return lines.join("\n");
    })
    .join("\n\n");

  return cachedLayer1;
}

function formatLayer2(): string {
  if (cachedLayer2) return cachedLayer2;

  const entries = readDataJson<UniversityLayer2Entry[]>("universities-layer2.json");

  if (!entries?.length) {
    cachedLayer2 = "(слой 2 пуст — проверьте data/universities-layer2.json)";
    return cachedLayer2;
  }

  cachedLayer2 = entries
    .map((e) => {
      const lines = [`### ${e.facultyAndUni}`, `Направления: ${e.specialty}`];

      if (isUseful(e.exams)) lines.push(`Вступительные: ${e.exams}`);
      if (isUseful(e.deadlines)) lines.push(`Сроки: ${e.deadlines}`);
      if (isUseful(e.documents)) lines.push(`Документы: ${e.documents}`);
      if (isUseful(e.languageRequirement)) {
        lines.push(`Язык: ${e.languageRequirement}`);
      }
      if (isUseful(e.price)) lines.push(`Стоимость/заявка: ${e.price}`);
      if (isUseful(e.nostrification)) {
        lines.push(`Нострификация: ${e.nostrification}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");

  return cachedLayer2;
}

/**
 * Компактный текст базы вузов для промпта Gemini.
 * layer 1 — curated подробные карточки; layer 2 — расширенный каталог.
 */
export function formatUniversitiesForPrompt(layer: UniversityLayer = 1): string {
  return layer === 2 ? formatLayer2() : formatLayer1();
}

/** Маркер: в слое 1 нет достаточно подходящих вариантов → нужен слой 2 */
export const NEED_BROADER_CATALOG_MARKER = "NEED_BROADER_CATALOG";

export function layerInstruction(layer: UniversityLayer): string {
  if (layer === 1) {
    return `
КАТАЛОГ ВУЗОВ — СЛОЙ 1 (приоритетный, подробный curated-список).
Выбирай вузы и факультеты СТРОГО из этого списка.
Если в слое 1 нет хотя бы 2 действительно подходящих вариантов под ответы пользователя — НЕ пиши HTML-отчёт.
Вместо этого верни РОВНО одну строку без кавычек и пояснений:
${NEED_BROADER_CATALOG_MARKER}
`.trim();
  }

  return `
КАТАЛОГ ВУЗОВ — СЛОЙ 2 (расширенный каталог факультетов Чехии).
Выбирай вузы и факультеты СТРОГО из этого списка.
Обязательно сформируй полный HTML-отчёт. Маркер ${NEED_BROADER_CATALOG_MARKER} здесь использовать нельзя.
`.trim();
}
