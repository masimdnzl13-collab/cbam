import type { Organization, SubscriptionPlan } from "@/lib/types";
import { PLAN_CONFIG, type PlanLimits } from "@/lib/billing/plans-config";

export function isInTrial(organization: Organization): boolean {
  return organization.subscriptionStatus === "trialing" && !!organization.trialEndsAt && organization.trialEndsAt > Date.now();
}

// Deneme süresince Profesyonel plan özellikleri açıktır; deneme bittiğinde
// veya iptal/geç ödeme durumunda organizasyonun gerçek planı esas alınır.
export function getEffectivePlan(organization: Organization): Exclude<SubscriptionPlan, "deneme"> {
  if (isInTrial(organization)) return "profesyonel";
  if (organization.subscriptionPlan === "deneme") return "baslangic";
  return organization.subscriptionPlan;
}

export function getEffectiveLimits(organization: Organization): PlanLimits {
  return PLAN_CONFIG[getEffectivePlan(organization)].limits;
}

export interface LimitCheckResult {
  allowed: boolean;
  limit: number | "unlimited";
  plan: Exclude<SubscriptionPlan, "deneme">;
}

export function checkLimit(
  organization: Organization,
  resource: keyof PlanLimits,
  currentCount: number
): LimitCheckResult {
  const limits = getEffectiveLimits(organization);
  const limit = limits[resource];
  const plan = getEffectivePlan(organization);
  if (limit === "unlimited" || typeof limit === "boolean") {
    return { allowed: true, limit: "unlimited", plan };
  }
  return { allowed: currentCount < limit, limit, plan };
}
