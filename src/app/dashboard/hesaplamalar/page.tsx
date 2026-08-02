"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { Calculator, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  COLLECTIONS,
  type ActivityData,
  type EmissionCalculation,
  type Installation,
  type Precursor,
  type Product,
  type ProductionProcess,
} from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { WaterfallChart } from "@/components/calculations/WaterfallChart";
import { calculateEmissions, type EmissionCalculationOutput } from "@/lib/calculations/emission-engine";
import { fetchLatestCalculationForProcess } from "@/lib/calculations/queries";
import { formatNumber } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import type { AnomalyExplanationDraft } from "@/lib/ai/schemas";

const CURRENT_YEAR = new Date().getFullYear();

export default function CalculationsPage() {
  const { organization } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [installationId, setInstallationId] = useState("");
  const [processId, setProcessId] = useState("");
  const [productId, setProductId] = useState("");
  const [periodYear, setPeriodYear] = useState(CURRENT_YEAR);
  const [periodQuarter, setPeriodQuarter] = useState("yillik");

  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<EmissionCalculationOutput | null>(null);
  const [previous, setPrevious] = useState<EmissionCalculation | null>(null);
  const [activityDataId, setActivityDataId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedCalcId, setSavedCalcId] = useState<string | null>(null);
  const [anomalyDraft, setAnomalyDraft] = useState<AnomalyExplanationDraft | null>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyFinalText, setAnomalyFinalText] = useState("");
  const [anomalyApproved, setAnomalyApproved] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    (async () => {
      const [instSnap, procSnap, prodSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.installations), where("organizationId", "==", organization.id))),
        getDocs(query(collection(db, COLLECTIONS.productionProcesses), where("organizationId", "==", organization.id))),
        getDocs(query(collection(db, COLLECTIONS.products), where("organizationId", "==", organization.id))),
      ]);
      setInstallations(instSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })));
      setProcesses(procSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })));
      setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })));
    })();
  }, [organization?.id]);

  const availableProcesses = processes.filter((p) => p.installationId === installationId);
  const availableProducts = products.filter((p) => p.processId === processId);
  const quarterValue = periodQuarter === "yillik" ? null : Number(periodQuarter);

  async function handleCompute() {
    if (!organization || !installationId || !processId) return;
    setComputing(true);
    setNotice(null);
    setResult(null);
    try {
      const process = processes.find((p) => p.id === processId)!;

      const adSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.activityData),
          where("organizationId", "==", organization.id),
          where("installationId", "==", installationId),
          where("processId", "==", processId),
          where("periodYear", "==", periodYear),
          where("periodQuarter", "==", quarterValue)
        )
      );
      if (adSnap.empty) {
        setNotice("Bu dönem için faaliyet verisi bulunamadı. Önce Faaliyet Verisi bölümünden veri girin.");
        return;
      }
      const activityDocs = adSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityData, "id">) }))
        .sort((a, b) => b.version - a.version);
      const activityData = activityDocs[0];
      setActivityDataId(activityData.id);

      let precursors: Precursor[] = [];
      let fallbackCategory: Product["cbamGoodsCategory"] = "kapsam_disi";
      if (productId) {
        const product = products.find((p) => p.id === productId);
        fallbackCategory = product?.cbamGoodsCategory ?? "kapsam_disi";
        const precSnap = await getDocs(
          query(collection(db, COLLECTIONS.precursors), where("productId", "==", productId))
        );
        precursors = precSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Precursor, "id">) }));
      }

      const ownProcessSpecificEmissions: Record<string, number> = {};
      for (const prec of precursors) {
        if (prec.sourceType === "own_process" && prec.ownProcessId) {
          const calc = await fetchLatestCalculationForProcess(organization.id, prec.ownProcessId);
          ownProcessSpecificEmissions[prec.ownProcessId] = calc?.specificEmbeddedEmissions ?? 0;
        }
      }

      const output = calculateEmissions(activityData, process, precursors, organization.sector, {
        ownProcessSpecificEmissions,
        fallbackCategory,
      });
      setResult(output);

      const prev = await fetchLatestCalculationForProcess(organization.id, processId, periodYear - 1);
      setPrevious(prev);
    } finally {
      setComputing(false);
    }
  }

  async function handleSave() {
    if (!organization || !result || !activityDataId) return;
    setSaving(true);
    try {
      const existing = await fetchLatestCalculationForProcess(organization.id, processId, periodYear);
      const nextVersion = (existing?.version ?? 0) + 1;

      const ref = await addDoc(collection(db, COLLECTIONS.emissionCalculations), {
        organizationId: organization.id,
        installationId,
        processId,
        productId: productId || null,
        activityDataId,
        periodYear,
        periodQuarter: quarterValue,
        version: nextVersion,
        directEmissionsTco2: result.directEmissionsTco2,
        indirectEmissionsTco2: result.indirectEmissionsTco2,
        precursorEmissionsTco2: result.precursorEmissionsTco2,
        totalEmbeddedEmissionsTco2: result.totalEmbeddedEmissionsTco2,
        outputQuantityTon: result.outputQuantityTon,
        specificEmbeddedEmissions: result.specificEmbeddedEmissions,
        reportedSpecificEmissions: result.reportedSpecificEmissions,
        reportedScope: result.reportedScope,
        inputsSnapshot: JSON.parse(JSON.stringify(result.precursorContributions)),
        factorsSnapshot: JSON.parse(JSON.stringify(result.fuelEmissions)),
        calculatedAt: Date.now(),
        createdAt: serverTimestamp(),
      });
      await logAudit({ action: "calculate", collection: COLLECTIONS.emissionCalculations, documentId: ref.id });
      setNotice("Hesaplama kaydedildi.");
      setSavedCalcId(ref.id);
      setAnomalyDraft(null);
      setAnomalyApproved(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateAnomalyDraft() {
    if (!result || !previous) return;
    setAnomalyLoading(true);
    try {
      const process = processes.find((p) => p.id === processId);
      const product = products.find((p) => p.id === productId);
      const res = await fetch("/api/ai/anomaly-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product?.name ?? "Ürün",
          processName: process?.name ?? "Proses",
          current: {
            directEmissionsTco2: result.directEmissionsTco2,
            indirectEmissionsTco2: result.indirectEmissionsTco2,
            specificEmbeddedEmissions: result.specificEmbeddedEmissions,
            outputQuantityTon: result.outputQuantityTon,
          },
          previous,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setAnomalyDraft(data.draft);
        setAnomalyFinalText(
          `${data.draft.summaryTr}\n\nOlası nedenler:\n${data.draft.likelyCausesTr.map((c: string) => `- ${c}`).join("\n")}`
        );
      }
    } finally {
      setAnomalyLoading(false);
    }
  }

  async function handleApproveAnomalyExplanation() {
    if (!organization || !savedCalcId || !anomalyDraft) return;
    await addDoc(collection(db, COLLECTIONS.periodExplanations), {
      organizationId: organization.id,
      calculationId: savedCalcId,
      processId,
      periodYear,
      periodQuarter: quarterValue,
      draftSummaryTr: anomalyDraft.summaryTr,
      draftCausesTr: anomalyDraft.likelyCausesTr,
      finalSummaryTr: anomalyFinalText,
      approved: true,
      approvedBy: auth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setAnomalyApproved(true);
  }

  if (!organization) return null;

  const waterfallSteps = result
    ? [
        { label: "Yakıt", value: result.fuelEmissionsTotalTco2, color: "#5b8dbe" },
        { label: "Proses", value: result.processEmissionTco2, color: "#3ecf8e" },
        { label: "Elektrik (dolaylı)", value: result.indirectEmissionsTco2, color: "#f2b134" },
        { label: "Öncü ürünler", value: result.precursorEmissionsTco2, color: "#ff6b35" },
        { label: "Toplam gömülü emisyon", value: result.totalEmbeddedEmissionsTco2, color: "#e8eaed", isTotal: true },
      ]
    : [];

  const delta = previous && result ? result.specificEmbeddedEmissions - previous.specificEmbeddedEmissions : null;

  return (
    <PageContainer title="Hesaplamalar" description="Faaliyet verisinden gömülü emisyona.">
      <Card className="mb-6 max-w-4xl">
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <Label>Tesis</Label>
              <Select value={installationId} onChange={(e) => { setInstallationId(e.target.value); setProcessId(""); setProductId(""); }}>
                <option value="">Seç...</option>
                {installations.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Proses</Label>
              <Select value={processId} onChange={(e) => { setProcessId(e.target.value); setProductId(""); }}>
                <option value="">Seç...</option>
                {availableProcesses.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Ürün (opsiyonel)</Label>
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Seçilmedi</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Dönem yılı</Label>
              <Select value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))}>
                {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Alt kırılım</Label>
              <Select value={periodQuarter} onChange={(e) => setPeriodQuarter(e.target.value)}>
                <option value="yillik">Yıllık</option>
                <option value="1">Ç1</option>
                <option value="2">Ç2</option>
                <option value="3">Ç3</option>
                <option value="4">Ç4</option>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleCompute} disabled={!installationId || !processId || computing}>
              <Calculator className="h-4 w-4" /> {computing ? "Hesaplanıyor..." : "Hesapla"}
            </Button>
          </div>
          {notice && <p className="mt-3 text-sm text-warning">{notice}</p>}
        </CardBody>
      </Card>

      {result && (
        <div className="max-w-4xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proses bazında şelale görünümü</CardTitle>
            </CardHeader>
            <CardBody>
              <WaterfallChart steps={waterfallSteps} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ürün bazında SEE (spesifik gömülü emisyon)</CardTitle>
            </CardHeader>
            <CardBody>
              <Table>
                <THead>
                  <TR>
                    <TH>Üretim çıktısı</TH>
                    <TH>Toplam gömülü emisyon</TH>
                    <TH>SEE (tCO₂e/ton)</TH>
                    <TH>Raporlama kapsamı</TH>
                    <TH>Raporlanan SEE</TH>
                  </TR>
                </THead>
                <TBody>
                  <TR>
                    <TD className="font-tabular">{formatNumber(result.outputQuantityTon, 0)} t</TD>
                    <TD className="font-tabular">{formatNumber(result.totalEmbeddedEmissionsTco2, 1)} tCO₂e</TD>
                    <TD className="font-tabular">{formatNumber(result.specificEmbeddedEmissions, 3)}</TD>
                    <TD>
                      <Badge tone={result.reportedScope === "direct_only" ? "steel" : "warning"}>
                        {result.reportedScope === "direct_only" ? "Yalnızca doğrudan" : "Doğrudan + dolaylı"}
                      </Badge>
                    </TD>
                    <TD className="font-tabular font-semibold text-accent">
                      {formatNumber(result.reportedSpecificEmissions, 3)}
                    </TD>
                  </TR>
                </TBody>
              </Table>
            </CardBody>
          </Card>

          {previous && delta !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Önceki dönemle karşılaştırma</CardTitle>
              </CardHeader>
              <CardBody className="flex items-center gap-3">
                {delta <= 0 ? (
                  <TrendingDown className="h-5 w-5 text-success" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-danger" />
                )}
                <p className="text-sm text-ink-muted">
                  Önceki döneme göre SEE{" "}
                  <span className={`font-tabular font-semibold ${delta <= 0 ? "text-success" : "text-danger"}`}>
                    {delta > 0 ? "+" : ""}
                    {formatNumber(delta, 3)} tCO₂e/ton
                  </span>{" "}
                  değişti.
                </p>
              </CardBody>
            </Card>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Hesaplamayı Kaydet"}
          </Button>

          {savedCalcId && previous && delta !== null && Math.abs(delta / (previous.specificEmbeddedEmissions || 1)) * 100 > 10 && (
            <Card className="border-accent/40">
              <CardHeader>
                <CardTitle>Dönemler Arası Anomali Açıklaması</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {!anomalyDraft ? (
                  <Button variant="secondary" size="sm" onClick={handleGenerateAnomalyDraft} disabled={anomalyLoading}>
                    <Sparkles className="h-3.5 w-3.5" /> {anomalyLoading ? "Taslak oluşturuluyor..." : "Claude Taslağı Oluştur"}
                  </Button>
                ) : anomalyApproved ? (
                  <p className="text-sm text-success">Açıklama onaylandı. İthalatçı paketine ve doğrulayıcı paketine eklenebilir.</p>
                ) : (
                  <>
                    <Label>Taslak açıklama (düzenleyebilirsin)</Label>
                    <Textarea rows={6} value={anomalyFinalText} onChange={(e) => setAnomalyFinalText(e.target.value)} />
                    <Button size="sm" onClick={handleApproveAnomalyExplanation}>
                      Onayla
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}
