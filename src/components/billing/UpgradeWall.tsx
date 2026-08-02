import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PLAN_CONFIG } from "@/lib/billing/plans-config";
import type { SubscriptionPlan } from "@/lib/types";

interface UpgradeWallProps {
  message: string;
  currentPlan: Exclude<SubscriptionPlan, "deneme">;
}

export function UpgradeWall({ message, currentPlan }: UpgradeWallProps) {
  const nextPlan = currentPlan === "baslangic" ? PLAN_CONFIG.profesyonel : PLAN_CONFIG.kurumsal;

  return (
    <Card className="border-accent/40">
      <CardBody className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-ink">{message}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Şu anki planın: <span className="text-ink font-medium">{PLAN_CONFIG[currentPlan].label}</span>.{" "}
            {nextPlan.label} planına geçerek devam edebilirsin.
          </p>
          <Link href="/dashboard/faturalama">
            <Button size="sm" className="mt-3">{nextPlan.label} Planına Yükselt</Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
