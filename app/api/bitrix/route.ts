import { NextResponse } from "next/server";
import Bitrix from "@2bad/bitrix";

const bitrix = Bitrix(process.env.SEND_LEADS || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leadData: any = {
/*       TITLE: body.title, */
      NAME: body.name,
/*       HAS_EMAIL: "Y",
      EMAIL: [{ VALUE_TYPE: "WORK", VALUE: body.email }],
      COMMENTS: body.report ? body.report + "\n" + body.answers : body.answers, */
      SOURCE_ID: body.source_id,
      UTM_SOURCE: body.utm?.source || "",
      UTM_MEDIUM: body.utm?.medium || "",
      UTM_CAMPAIGN: body.utm?.campaign || "",
      UTM_CONTENT: body.utm?.content || "",
      UTM_TERM: body.utm?.term || "",
    };

    const lead = await bitrix.leads.create(leadData);

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    console.error("❌ Bitrix API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
