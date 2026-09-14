import { generateReport, needsBroaderCatalog } from "@/services/geminiService";
import { buildReportPrompt } from "@/utils/buildReportPrompt";
import type { Answer } from "@/context/QuizContext";
import type { Quiz } from "@/sanity/lib/types";
import type { Locale } from "@/dictionaries/promptsDictionary";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      promptText,
      promptTextFallback,
      role,
      level,
      answers,
      locale,
      sanityQuiz,
    } = body as {
      promptText?: string;
      promptTextFallback?: string;
      role?: string;
      level?: string;
      answers?: Answer[];
      locale?: Locale;
      sanityQuiz?: Quiz | null;
    };

    let primaryPrompt = promptText;
    let fallbackPrompt = promptTextFallback;

    // Prefer building prompts on the server (keeps large university catalogs out of the client bundle)
    if (!primaryPrompt && role && level && answers && locale) {
      const promptParams = {
        sanityQuiz: sanityQuiz ?? null,
        role,
        level,
        answers,
        locale,
      };
      [primaryPrompt, fallbackPrompt] = await Promise.all([
        buildReportPrompt({ ...promptParams, universityLayer: 1 }),
        buildReportPrompt({ ...promptParams, universityLayer: 2 }),
      ]);
    }

    if (!primaryPrompt) {
      return NextResponse.json(
        { error: "Prompt text is required" },
        { status: 400 }
      );
    }

    let report = await generateReport(primaryPrompt);
    let usedLayer: 1 | 2 = 1;

    if (needsBroaderCatalog(report) && fallbackPrompt) {
      console.log("[report] Layer 1 insufficient → trying layer 2 catalog");
      report = await generateReport(fallbackPrompt);
      usedLayer = 2;
    }

    if (needsBroaderCatalog(report)) {
      return NextResponse.json(
        {
          error:
            "Could not build a report from available university catalogs",
          report: null,
          usedLayer,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ report, usedLayer });
  } catch (err) {
    console.error("❌ API fatal error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}
