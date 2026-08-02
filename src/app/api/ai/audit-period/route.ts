import { NextRequest, NextResponse } from "next/server";
import { auditPeriodConsistency } from "@/lib/ai/logic-audit";
import { logServerError } from "@/lib/errors/log-error";
import type { ActivityData, ProductionRouteType, Sector } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sector, productionRouteType, activityData } = body as {
    sector: Sector;
    productionRouteType: ProductionRouteType;
    activityData: Pick<ActivityData, "fuels" | "electricity" | "inputMaterials" | "outputQuantityTon">;
  };

  try {
    const result = await auditPeriodConsistency({ sector, productionRouteType, activityData });
    return NextResponse.json({ result });
  } catch (err) {
    await logServerError("ai:audit-period", err);
    return NextResponse.json({ error: "Mantık denetimi başarısız oldu" }, { status: 500 });
  }
}
