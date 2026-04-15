/* import 'server-only';

import {
  GoogleGenerativeAI,
  GenerationConfig,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { z } from 'zod';
import { getDictionary } from '@/dictionaries/dictionaries';

// === 1) ENV ===
function safeParseEnvNumber(envVar: string | undefined, defaultValue: number): number {
  if (envVar === undefined) return defaultValue;
  const parsed = Number(envVar);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.');

const GEMINI_API_MODEL = process.env.GEMINI_API_MODEL || 'gemini-1.5-flash-latest';
const GEMINI_REQUEST_TIMEOUT_MS = safeParseEnvNumber(process.env.GEMINI_REQUEST_TIMEOUT_MS, 30000);
const GEMINI_MAX_TOKENS = Math.min(safeParseEnvNumber(process.env.GEMINI_MAX_TOKENS, 2048), 4096);
const GEMINI_TEMPERATURE = safeParseEnvNumber(process.env.GEMINI_TEMPERATURE, 0.7);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generationConfig: GenerationConfig = {
  maxOutputTokens: GEMINI_MAX_TOKENS,
  temperature: GEMINI_TEMPERATURE,
};

const safetySettings: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// === 2) Валидация входа ===
const AnswerSchema = z.object({
  question: z.string(),
  answer: z.string(),
  type: z.string(),
});

const ParamsSchema = z.object({
  lang: z.string().default('ua'),
  userRole: z.string().min(1),
  educationLevel: z.string().min(1),
  languagePreference: z.string().default('ua'),
  scores: z.record(z.number()),
  userAnswers: z.array(AnswerSchema),
});

export type GenerateReportParams = z.infer<typeof ParamsSchema>;

// === 3) Хелперы ===
const now = () => Date.now();

function truncate(text: string, maxLength = 6000): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '\n...[truncated]' : text;
}

function pickTopDir(scores: Record<string, number>) {
  const keys = Object.keys(scores).filter((k) => Number.isFinite(scores[k]));
  if (!keys.length) return 'technical';
  return keys.reduce((a, b) => (scores[b] > scores[a] ? b : a));
}

function hasHttpStatus(e: unknown): e is { status: number } {
  return typeof e === 'object' && e !== null && 'status' in e && typeof (e as any).status === 'number';
}

type ApiResponse =
  | { ok: true; reportMarkdown: string }
  | { ok: false; error: string };

// === 4) Core ===
export async function generateReport(params: GenerateReportParams): Promise<ApiResponse> {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    // Не логируем PII, только технические детали
    console.error('[Gemini] invalid params', parsed.error.issues.map((i) => i.path.join('.')));
    return { ok: false, error: 'Invalid input data.' };
  }

  const t0 = now();
  const { lang, userRole, educationLevel, languagePreference, scores, userAnswers } = parsed.data;

  try {
    const dict = await getDictionary(lang).catch(() => null);
    const promptsRoot = dict?.proforientation?.prompts;

    if (!promptsRoot) {
      console.error(`[Gemini] prompts missing for lang=${lang}`);
      return { ok: false, error: 'Dictionary prompts not found.' };
    }

    const reportGeneration = promptsRoot.reportGeneration || {};
    const common = reportGeneration.common || {
      persona: 'Виступай як академічний карʼєрний консультант.',
      questionPrefix: 'Питання',
      answerPrefix: 'Відповідь',
      cta: '\n\nЗаверши чітким CTA на консультацію.',
    };

    const dirLabels = promptsRoot.DIR_LABELS || { technical: 'Технічний', default: 'Технічний' };
    const promptKey = userRole === 'parent' ? 'parent' : (`student_${educationLevel}` as keyof typeof reportGeneration);
    const promptCfg =
      (reportGeneration as any)[promptKey] ||
      (reportGeneration as any)['student_grade_11'] || {
        context: '',
        task: '',
        personalization: '',
        structure: '',
        knowledgeBase: '',
      };

    const topDirKey = pickTopDir(scores);
    const topDirLabel = dirLabels[topDirKey] || dirLabels.default || 'Технічний';

    const openAnswersText = userAnswers
      .filter((a) => a.type === 'open-ended' && a.answer.trim())
      .map((a) => `${common.questionPrefix}: ${a.question}\n${common.answerPrefix}: ${a.answer}`)
      .join('\n\n');

    const safeOpenAnswers = truncate(openAnswersText, 5000);
    const safeScores = truncate(JSON.stringify(scores, null, 2), 1500);

    const promptParts = [
      common.persona,
      promptCfg.context,
      promptCfg.task,
      promptCfg.personalization,
      promptCfg.structure,
      promptCfg.knowledgeBase,
      common.cta,
      '[[Контекст]]',
      `Роль: ${userRole}`,
      `Освіта: ${educationLevel}`,
      `Мова відповіді: ${languagePreference}`,
      `Провідний напрям: ${topDirLabel} (${topDirKey})`,
      `Бали: ${safeScores}`,
      '',
      'Відкриті відповіді:',
      safeOpenAnswers,
    ].filter(Boolean);

    let finalPrompt = promptParts.join('\n\n');

    // Подстановки (если шаблон содержит плейсхолдеры)
    finalPrompt = finalPrompt
      .replace(/{userRole}/g, userRole)
      .replace(/{educationLevel}/g, educationLevel)
      .replace(/{languagePreference}/g, languagePreference)
      .replace(/{topDirection}/g, topDirLabel)
      .replace(/{openAnswers}/g, safeOpenAnswers)
      .replace(/{scores}/g, safeScores);

    const model = genAI.getGenerativeModel({
      model: GEMINI_API_MODEL,
      generationConfig,
      safetySettings,
    });

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

      try {
        const resultPromise = model.generateContent({
          contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        });

        // Грамотная типизация Promise.race:
        const response = await Promise.race([
          resultPromise,
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('Request timed out')));
          }),
        ]);

        const reportMarkdown = response.response.text() || '';
        if (!reportMarkdown.trim()) {
          lastError = new Error('Empty response from model');
          throw lastError;
        }

        const dt = now() - t0;
        console.info(
          `[Gemini] ok model=${GEMINI_API_MODEL} promptChars=${finalPrompt.length} tokens=${GEMINI_MAX_TOKENS} dtMs=${dt}`
        );
        return { ok: true, reportMarkdown };
      } catch (err: any) {
        lastError = err;
        // Не ретраим AbortError и клиентские 4xx
        const isAbort = err?.name === 'AbortError' || /timed out/i.test(String(err?.message));
        const isClientErr = hasHttpStatus(err) && err.status < 500;
        if (isAbort || isClientErr || attempt === 2) {
          throw err;
        }
        // backoff + jitter
        const delay = 500 * 2 ** attempt + Math.floor(Math.random() * 250);
        await new Promise((r) => setTimeout(r, delay));
      } finally {
        clearTimeout(timeout);
      }
    }

    // До сюда обычно не дойдём, но на всякий случай:
    throw lastError ?? new Error('Unknown error');
  } catch (error: any) {
    const dt = now() - t0;
    const msg = error?.message || String(error);
    console.error(`[Gemini] fail model=${GEMINI_API_MODEL} dtMs=${dt} msg=${msg}`);
    return { ok: false, error: 'Failed to generate the report.' };
  }
}
 */