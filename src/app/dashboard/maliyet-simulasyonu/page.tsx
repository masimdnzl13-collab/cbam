"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Printer } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type EmissionCalculation, type Product } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ScenarioSlider } from "@/components/simulation/ScenarioSlider";
import { formatEuro, formatNumber } from "@/lib/utils";
import {
  CBAM_CERTIFICATE_PRICE_EUR,
  CBAM_CERTIFICATE_PRICE_SCENARIOS,
  SIMULATION_YEAR_RANGE,
  getCertificateObligationShare,
  getDefaultValueMarkup,
} from "@/lib/config/cbam-config";
import { getDefaultValue } from "@/lib/config/default-values";

const TARGET_YEAR = 2027;

export default function CostSimulationPage() {
  const { organization } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [calc, setCalc] = useState<EmissionCalculation | null>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [annualExportTon, setAnnualExportTon] = useState(0);

  const [renewableShift, setRenewableShift] = useState(0);
  const [fuelSwitch, setFuelSwitch] = useState(0);
  const [precursorImprovement, setPrecursorImprovement] = useState(0);

  useEffect(() => {
    if (!organization?.id) return;
    getDocs(query(collection(db, COLLECTIONS.products), where("organizationId", "==", organization.id))).then(
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })))
    );
  }, [organization?.id]);

  useEffect(() => {
    if (!organization?.id || !productId) {
      setCalc(null);
      return;
    }
    setLoadingCalc(true);
    const product = products.find((p) => p.id === productId);
    if (product) setAnnualExportTon(product.annualEuExportTon ?? 0);

    getDocs(
      query(
        collection(db, COLLECTIONS.emissionCalculations),
        where("organizationId", "==", organization.id),
        where("productId", "==", productId)
      )
    ).then((snap) => {
      if (snap.empty) {
        setCalc(null);
      } else {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<EmissionCalculation, "id">) }))
          .sort((a, b) => b.version - a.version || b.calculatedAt - a.calculatedAt);
        setCalc(docs[0]);
      }
      setLoadingCalc(false);
    });
  }, [organization?.id, productId, products]);

  const product = products.find((p) => p.id === productId);

  const comparison = useMemo(() => {
    if (!calc || !product) return null;
    const defaultEntry = getDefaultValue(product.cbamGoodsCategory);
    const markup = getDefaultValueMarkup(TARGET_YEAR);
    const defaultIntensity = defaultEntry
      ? calc.reportedScope === "direct_only"
        ? defaultEntry.directTco2PerTon * (1 + markup)
        : (defaultEntry.directTco2PerTon + defaultEntry.indirectTco2PerTon) * (1 + markup)
      : calc.reportedSpecificEmissions * (1 + markup);

    const obligationShare = getCertificateObligationShare(TARGET_YEAR);
    const realCostEur = calc.reportedSpecificEmissions * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;
    const defaultCostEur = defaultIntensity * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;

    return {
      realIntensity: calc.reportedSpecificEmissions,
      defaultIntensity,
      markupPercent: markup * 100,
      realCostEur,
      defaultCostEur,
      diffEur: defaultCostEur - realCostEur,
      diffPerTonEur: (defaultIntensity - calc.reportedSpecificEmissions) * CBAM_CERTIFICATE_PRICE_EUR,
    };
  }, [calc, product, annualExportTon]);

  const yearlyProjection = useMemo(() => {
    if (!calc) return [];
    const points = [];
    for (let year = SIMULATION_YEAR_RANGE.start; year <= SIMULATION_YEAR_RANGE.end; year++) {
      const share = getCertificateObligationShare(year);
      const base = calc.reportedSpecificEmissions * annualExportTon * share;
      points.push({
        year,
        dusuk: base * CBAM_CERTIFICATE_PRICE_SCENARIOS.dusuk,
        orta: base * CBAM_CERTIFICATE_PRICE_SCENARIOS.orta,
        yuksek: base * CBAM_CERTIFICATE_PRICE_SCENARIOS.yuksek,
      });
    }
    return points;
  }, [calc, annualExportTon]);

  const scenario = useMemo(() => {
    if (!calc) return null;
    const newDirect = calc.directEmissionsTco2 * (1 - fuelSwitch / 100);
    const newIndirect = calc.indirectEmissionsTco2 * (1 - renewableShift / 100);
    const newPrecursor = calc.precursorEmissionsTco2 * (1 - precursorImprovement / 100);
    const newTotal = newDirect + newIndirect + newPrecursor;
    const newReportedTotal = calc.reportedScope === "direct_only" ? newDirect + newPrecursor : newTotal;
    const newSee = calc.outputQuantityTon > 0 ? newReportedTotal / calc.outputQuantityTon : 0;
    const obligationShare = getCertificateObligationShare(TARGET_YEAR);
    const newCost = newSee * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;
    const baselineCost = calc.reportedSpecificEmissions * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;
    return { newSee, newCost, savings: baselineCost - newCost };
  }, [calc, fuelSwitch, renewableShift, precursorImprovement, annualExportTon]);

  if (!organization) return null;

  return (
    <PageContainer
      title="Maliyet Simülasyonu"
      description="Gerçek verinle AB varsayılan değerini kıyasla, çok yıllı maliyetini gör."
      actions={
        <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> PDF olarak indir
        </Button>
      }
    >
      <Card className="mb-6 max-w-3xl print:hidden">
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Ürün</Label>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Seç...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Yıllık AB ihracatı (ton)</Label>
            <Input
              type="number"
              min={0}
              value={annualExportTon}
              onChange={(e) => setAnnualExportTon(Number(e.target.value))}
            />
          </div>
        </CardBody>
      </Card>

      {productId && !calc && !loadingCalc && (
        <Card className="max-w-3xl">
          <CardBody className="text-sm text-ink-muted">
            Bu ürün için henüz kaydedilmiş bir emisyon hesaplaması yok. Önce Hesaplamalar bölümünden
            bu ürünün prosesini hesapla.
          </CardBody>
        </Card>
      )}

      {calc && comparison && (
        <div className="max-w-3xl space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Gerçek veri vs. AB varsayılan değeri ({TARGET_YEAR})</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-steel/30 bg-steel/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-steel">Senin gerçek verin</p>
                  <p className="mt-2 font-tabular text-xl font-semibold text-ink">
                    {formatNumber(comparison.realIntensity, 3)} tCO₂e/ton
                  </p>
                  <p className="mt-1 font-tabular text-sm text-ink-muted">{formatEuro(comparison.realCostEur)} / yıl</p>
                </div>
                <div className="rounded border border-warning/30 bg-warning/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-warning">
                    AB varsayılan değeri (+%{formatNumber(comparison.markupPercent, 0)})
                  </p>
                  <p className="mt-2 font-tabular text-xl font-semibold text-ink">
                    {formatNumber(comparison.defaultIntensity, 3)} tCO₂e/ton
                  </p>
                  <p className="mt-1 font-tabular text-sm text-ink-muted">{formatEuro(comparison.defaultCostEur)} / yıl</p>
                </div>
              </div>
              <div className="rounded border border-accent/40 bg-accent/5 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  AB müşterinin ton başına tasarrufu
                </p>
                <p className="mt-1 font-tabular text-2xl font-semibold text-accent">
                  {formatEuro(comparison.diffPerTonEur)} / ton
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{SIMULATION_YEAR_RANGE.start}–{SIMULATION_YEAR_RANGE.end} çok yıllı maliyet projeksiyonu</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyProjection} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333a46" vertical={false} />
                    <XAxis dataKey="year" stroke="#9aa3b2" fontSize={12} tickLine={false} axisLine={{ stroke: "#333a46" }} />
                    <YAxis
                      stroke="#9aa3b2"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `€${Math.round(v / 1000)}k`}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{ background: "#1f232b", border: "1px solid #333a46", borderRadius: 4, fontSize: 12 }}
                      labelStyle={{ color: "#e8eaed" }}
                      formatter={(value) => formatEuro(Number(value))}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="dusuk" name={`Düşük (€${CBAM_CERTIFICATE_PRICE_SCENARIOS.dusuk})`} stroke="#5b8dbe" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="orta" name={`Orta (€${CBAM_CERTIFICATE_PRICE_SCENARIOS.orta})`} stroke="#ff6b35" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="yuksek" name={`Yüksek (€${CBAM_CERTIFICATE_PRICE_SCENARIOS.yuksek})`} stroke="#e5484d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Serbest tahsisatın kademeli azalması nedeniyle sertifika yükümlülüğüne tabi emisyon payı
                büyür; üç çizgi farklı sertifika fiyatı senaryolarını (€{CBAM_CERTIFICATE_PRICE_SCENARIOS.dusuk} /
                €{CBAM_CERTIFICATE_PRICE_SCENARIOS.orta} / €{CBAM_CERTIFICATE_PRICE_SCENARIOS.yuksek}) yansıtır.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ne yaparsan ne kazanırsın?</CardTitle>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="space-y-5 print:hidden">
                <ScenarioSlider
                  label="Elektrik kaynağını yenilenebilire çevir"
                  value={renewableShift}
                  onChange={setRenewableShift}
                  hint="Dolaylı emisyonu bu oranda azaltır."
                />
                <ScenarioSlider
                  label="Yakıtı daha temiz bir türe çevir (ör. kömürden doğalgaza)"
                  value={fuelSwitch}
                  onChange={setFuelSwitch}
                  hint="Doğrudan emisyonu bu oranda azaltır."
                />
                <ScenarioSlider
                  label="Hurda oranını / girdi verimliliğini artır"
                  value={precursorImprovement}
                  onChange={setPrecursorImprovement}
                  hint="Öncü ürün kaynaklı emisyonu bu oranda azaltır."
                />
              </div>
              {scenario && (
                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="rounded border border-base-border bg-base-surface2 p-3">
                    <p className="text-xs text-ink-muted">Yeni SEE</p>
                    <p className="mt-1 font-tabular text-lg font-semibold text-ink">
                      {formatNumber(scenario.newSee, 3)} tCO₂e/ton
                    </p>
                  </div>
                  <div className="rounded border border-base-border bg-base-surface2 p-3">
                    <p className="text-xs text-ink-muted">Yeni yıllık maliyet ({TARGET_YEAR})</p>
                    <p className="mt-1 font-tabular text-lg font-semibold text-ink">{formatEuro(scenario.newCost)}</p>
                  </div>
                  <div className="rounded border border-success/30 bg-success/5 p-3">
                    <p className="text-xs text-success">Tasarruf</p>
                    <p className="mt-1 font-tabular text-lg font-semibold text-success">
                      {formatEuro(scenario.savings)}
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Badge tone="neutral">
            Raporlama kapsamı: {calc.reportedScope === "direct_only" ? "Yalnızca doğrudan" : "Doğrudan + dolaylı"}
          </Badge>
        </div>
      )}
    </PageContainer>
  );
}
