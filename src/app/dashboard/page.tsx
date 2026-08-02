"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  CheckCircle2,
  Circle,
  Gauge,
  Calculator,
  Send,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  COLLECTIONS,
  type ActivityData,
  type EmissionCalculation,
  type ImporterPackage,
  type Installation,
  type Precursor,
  type ProductionProcess,
  type Product,
} from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SECTOR_LABELS, SECTOR_REPORTED_SCOPE } from "@/lib/config/cbam-config";
import { calcOverallCompleteness, findMissingDataActions } from "@/lib/dashboard/completeness";
import { CBAM_CALENDAR_EVENTS, getNextCriticalDate } from "@/lib/dashboard/calendar";
import { ImporterRequestTracker } from "@/components/dashboard/ImporterRequestTracker";
import { formatDateTR, formatNumber } from "@/lib/utils";

export default function DashboardHomePage() {
  const { organization } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [precursors, setPrecursors] = useState<Precursor[]>([]);
  const [calculations, setCalculations] = useState<EmissionCalculation[]>([]);
  const [packages, setPackages] = useState<ImporterPackage[]>([]);

  useEffect(() => {
    if (!organization?.id) return;
    const orgId = organization.id;
    const unsubs = [
      onSnapshot(query(collection(db, COLLECTIONS.installations), where("organizationId", "==", orgId)), (s) =>
        setInstallations(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })))
      ),
      onSnapshot(query(collection(db, COLLECTIONS.productionProcesses), where("organizationId", "==", orgId)), (s) =>
        setProcesses(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })))
      ),
      onSnapshot(query(collection(db, COLLECTIONS.products), where("organizationId", "==", orgId)), (s) =>
        setProducts(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })))
      ),
      onSnapshot(query(collection(db, COLLECTIONS.activityData), where("organizationId", "==", orgId)), (s) =>
        setActivityData(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityData, "id">) })))
      ),
      onSnapshot(query(collection(db, COLLECTIONS.precursors), where("organizationId", "==", orgId)), (s) =>
        setPrecursors(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Precursor, "id">) })))
      ),
      onSnapshot(query(collection(db, COLLECTIONS.emissionCalculations), where("organizationId", "==", orgId)), (s) =>
        setCalculations(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EmissionCalculation, "id">) })))
      ),
      onSnapshot(query(collection(db, COLLECTIONS.importerPackages), where("organizationId", "==", orgId)), (s) =>
        setPackages(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImporterPackage, "id">) })))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [organization?.id]);

  if (!organization) return null;

  const checklist = organization.onboardingChecklist ?? {
    installationDetailsCompleted: false,
    firstActivityDataEntered: false,
    productsMapped: false,
  };
  const reportedScope = SECTOR_REPORTED_SCOPE[organization.sector];

  const completeness = calcOverallCompleteness({ installations, processes, products, activityData, precursors });
  const missingActions = findMissingDataActions({ installations, processes, products, activityData, precursors });

  const currentYear = new Date().getFullYear();
  const currentYearCalcs = calculations.filter((c) => c.periodYear === currentYear);
  const avgSee = currentYearCalcs.length
    ? currentYearCalcs.reduce((sum, c) => sum + c.reportedSpecificEmissions, 0) / currentYearCalcs.length
    : null;

  const sentPackages = packages.filter((p) => p.status !== "taslak");
  const openedPackages = packages.filter((p) => p.status === "goruntulendi" || p.status === "onaylandi");
  const openRate = sentPackages.length ? Math.round((openedPackages.length / sentPackages.length) * 100) : 0;

  const nextEvent = getNextCriticalDate();
  const daysToNext = nextEvent ? Math.ceil((new Date(nextEvent.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const CHECKLIST_ITEMS = [
    { key: "installationDetailsCompleted" as const, label: "Tesis detaylarını tamamla", href: "/dashboard/tesisler" },
    { key: "firstActivityDataEntered" as const, label: "İlk dönem faaliyet verini gir", href: "/dashboard/faaliyet-verisi" },
    { key: "productsMapped" as const, label: "Ürünlerini CN koduyla eşle", href: "/dashboard/urunler" },
  ];

  return (
    <PageContainer title={`Merhaba, ${organization.name}`} description="SKDM hazırlığının genel durumu.">
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardBody className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-steel" />
            <div>
              <p className="font-tabular text-xl font-semibold text-ink">%{completeness.overallPercent}</p>
              <p className="text-xs text-ink-muted">Genel veri tamlığı</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-steel" />
            <div>
              <p className="font-tabular text-xl font-semibold text-ink">
                {avgSee != null ? formatNumber(avgSee, 2) : "–"}
              </p>
              <p className="text-xs text-ink-muted">{currentYear} ort. SEE (tCO₂e/t)</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <Send className="h-5 w-5 text-steel" />
            <div>
              <p className="font-tabular text-xl font-semibold text-ink">
                {sentPackages.length} <span className="text-xs text-ink-faint">(%{openRate} açıldı)</span>
              </p>
              <p className="text-xs text-ink-muted">Gönderilen paket</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-accent" />
            <div>
              <p className="font-tabular text-xl font-semibold text-ink">{daysToNext ?? "–"} gün</p>
              <p className="text-xs text-ink-muted">{nextEvent?.label ?? "Kritik tarih yok"}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <h3 className="font-heading text-sm font-semibold text-ink mb-3">Kritik Tarih Takvimi</h3>
          <div className="grid gap-3 sm:grid-cols-5">
            {CBAM_CALENDAR_EVENTS.map((ev) => (
              <div key={ev.date} className="rounded border border-base-border bg-base-surface2 p-3">
                <p className="font-tabular text-xs text-ink-faint">{formatDateTR(ev.date)}</p>
                <p className="mt-1 text-xs font-medium text-ink">{ev.label}</p>
                <Badge tone={ev.tone} className="mt-2">{ev.note}</Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card>
          <CardBody>
            <h3 className="font-heading text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" /> Eksik Veri Aksiyonları
            </h3>
            {missingActions.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">Harika — bilinen bir veri eksiği yok.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {missingActions.map((a, i) => (
                  <Link
                    key={i}
                    href={a.href}
                    className="flex items-center justify-between gap-2 rounded border border-base-border bg-base-surface2 px-3 py-2 text-sm text-ink-muted hover:text-ink hover:border-warning/40"
                  >
                    {a.label}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="font-heading text-sm font-semibold text-ink mb-3">Başlangıç kontrol listesi</h3>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const done = checklist[item.key];
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-center gap-3 rounded border border-base-border bg-base-surface2 p-3 hover:border-steel/50 transition-colors"
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-ink-faint shrink-0" />
                    )}
                    <p className={`flex-1 text-sm ${done ? "text-ink-muted line-through" : "text-ink"}`}>{item.label}</p>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-base-border">
              <p className="text-xs text-ink-muted mb-2">
                <span className="text-ink font-medium">{SECTOR_LABELS[organization.sector]}</span> — raporlanan kapsam:
              </p>
              <Badge tone={reportedScope === "direct_only" ? "steel" : "warning"}>
                {reportedScope === "direct_only" ? "Yalnızca doğrudan emisyonlar" : "Doğrudan + dolaylı emisyonlar"}
              </Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      <ImporterRequestTracker />
    </PageContainer>
  );
}
