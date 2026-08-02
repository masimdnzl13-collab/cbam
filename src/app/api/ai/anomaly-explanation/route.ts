import { NextRequest, NextResponse } from "next/server";
import { draftAnomalyExplanation } from "@/lib/ai/anomaly-explanation";
import { logServerError } from "@/lib/errors/log-error";
import type { EmissionCalculation } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productName, processName, current, previous } = body as {
    productName: string;
    processName: string;
    current: EmissionCalculation;
    previous: EmissionCalculation;
  };

  try {
    const draft = await draftAnomalyExplanation({ productName, processName, current, previous });
    return NextResponse.json({ draft });
  } catch (err) {
    await logServerError("ai:anomaly-explanation", err);
    return NextResponse.json({ error: "Anomali açıklaması oluşturulamadı" }, { status: 500 });
  }
}
