"use client";

import { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/firebase";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PLAN_CONFIG } from "@/lib/billing/plans-config";
import { getEffectivePlan, isInTrial } from "@/lib/billing/limits";
import { formatEuro, toDate } from "@/lib/utils";
import type { BillingInterval } from "@/lib/types";

export default function BillingPage() {
  const { organization } = useAuth();
  const [interval, setInterval_] = useState<BillingInterval>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!organization) return null;

  const effectivePlan = getEffectivePlan(organization);
  const trial = isInTrial(organization);

  async function handleUpgrade(planId: "baslangic" | "profesyonel") {
    if (!organization || !auth.currentUser) return;
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          organizationName: organization.name,
          customerEmail: organization.contactEmail,
          planId,
          interval,
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error ?? "Ödeme oturumu başlatılamadı.");
      }
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <PageContainer title="Faturalama" description="Planını yönet, yükselt veya değiştir.">
      {trial && organization.trialEndsAt && (
        <Card className="mb-6 border-steel/40">
          <CardBody className="text-sm text-ink-muted">
            Deneme sürümündesin — <span className="text-ink font-medium">Profesyonel</span> plan özellikleri{" "}
            <span className="text-ink font-medium">{toDate(organization.trialEndsAt).toLocaleDateString("tr-TR")}</span>{" "}
            tarihine kadar açık. Kredi kartı gerekmez.
          </CardBody>
        </Card>
      )}

      {organization.subscriptionStatus === "past_due" && (
        <Card className="mb-6 border-danger/40">
          <CardBody className="flex items-center gap-3 text-sm text-ink-muted">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
            Son ödemen başarısız oldu. 7 günlük esneme süresi içinde ödeme yöntemini güncellemezsen
            planın Başlangıç seviyesine düşürülecek.
          </CardBody>
        </Card>
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className={`text-sm ${interval === "monthly" ? "text-ink" : "text-ink-muted"}`}>Aylık</span>
        <button
          onClick={() => setInterval_(interval === "monthly" ? "yearly" : "monthly")}
          className="relative h-6 w-11 rounded-full bg-base-surface2 border border-base-border"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-accent transition-all ${
              interval === "yearly" ? "left-6" : "left-0.5"
            }`}
          />
        </button>
        <span className={`text-sm ${interval === "yearly" ? "text-ink" : "text-ink-muted"}`}>
          Yıllık <Badge tone="success" className="ml-1">2 ay bedava</Badge>
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.values(PLAN_CONFIG).map((plan) => {
          const price = interval === "yearly" ? plan.yearlyPriceEur : plan.monthlyPriceEur;
          const isCurrent = effectivePlan === plan.id && !trial;
          return (
            <Card key={plan.id} className={isCurrent ? "border-accent" : undefined}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-base font-semibold text-ink">{plan.label}</h3>
                  {isCurrent && <Badge tone="accent">Mevcut Plan</Badge>}
                </div>
                <p className="mt-3 font-tabular text-2xl font-semibold text-ink">
                  {price != null ? (
                    <>
                      {formatEuro(price)}
                      <span className="text-sm font-normal text-ink-muted">/{interval === "yearly" ? "yıl" : "ay"}</span>
                    </>
                  ) : (
                    "İletişime geç"
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.featureBullets.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {plan.id === "kurumsal" ? (
                    <a href="mailto:merhaba@karbonrota.com?subject=Kurumsal%20Plan">
                      <Button variant="secondary" className="w-full">İletişime Geç</Button>
                    </a>
                  ) : isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Mevcut Planın
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id as "baslangic" | "profesyonel")}
                      disabled={loadingPlan === plan.id}
                    >
                      {loadingPlan === plan.id ? "Yönlendiriliyor..." : "Bu Plana Geç"}
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
