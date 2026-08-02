import { NextRequest, NextResponse } from "next/server";
import { billingProvider } from "@/lib/billing";
import type { BillingInterval, SubscriptionPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { organizationId, organizationName, customerEmail, planId, interval } = body as {
    organizationId: string;
    organizationName: string;
    customerEmail: string;
    planId: Exclude<SubscriptionPlan, "deneme">;
    interval: BillingInterval;
  };

  if (!organizationId || !planId || !interval) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const origin = req.nextUrl.origin;

  try {
    const result = await billingProvider.createCheckoutSession({
      organizationId,
      organizationName,
      customerEmail,
      planId,
      interval,
      successUrl: `${origin}/dashboard/faturalama?checkout=success`,
      cancelUrl: `${origin}/dashboard/faturalama?checkout=cancelled`,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ödeme oturumu başlatılamadı" }, { status: 500 });
  }
}
