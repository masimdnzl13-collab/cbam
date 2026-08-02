"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatEuro, formatNumber } from "@/lib/utils";
import type { ExposureEstimateResult, YearlyCostPoint } from "@/lib/calculations/exposure-estimate";
import { Printer, Share2 } from "lucide-react";

interface ResultScreenProps {
  result: ExposureEstimateResult;
  projection: YearlyCostPoint[];
  annualExportTon: number;
  onRestart: () => void;
}

export function ResultScreen({ result, projection, annualExportTon, onRestart }: ResultScreenProps) {
  return (
    <div className="space-y-5 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Badge tone="success">Sonuç Hazır</Badge>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Yazdır
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "KarbonRota SKDM Maruziyet Hesabı", url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Share2 className="h-3.5 w-3.5" /> Paylaş
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Tahmini yıllık gömülü emisyon</p>
            <p className="mt-2 font-tabular text-2xl font-semibold text-ink">
              {formatNumber(result.estimatedAnnualEmissionTon, 0)} <span className="text-sm text-ink-muted">tCO₂e</span>
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {result.sectorLabel} tipik yoğunluğu: {formatNumber(result.typicalIntensity, 2)} tCO₂e/ton ×{" "}
              {formatNumber(annualExportTon, 0)} ton
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-ink-muted">2027 tahmini CBAM maliyeti</p>
            <p className="mt-2 font-tabular text-2xl font-semibold text-accent">
              {formatEuro(result.estimatedImporterCostEur)}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              Sertifika fiyatı € {result.certificatePriceEur}/tCO₂e varsayımıyla
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Ton başına rekabet farkı</p>
            <p className="mt-2 font-tabular text-2xl font-semibold text-success">
              {formatEuro(result.costDifferenceEur)}
            </p>
            <p className="mt-1 text-xs text-ink-faint">Gerçek veri ile varsayılan değer arasındaki fark</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerçek veri vs. varsayılan değer + yıllık artırım</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="rounded border border-steel/30 bg-steel/5 p-4">
            <p className="text-xs uppercase tracking-wide text-steel">Senin gerçek verin (tahmini)</p>
            <p className="mt-2 font-tabular text-xl font-semibold text-ink">
              {formatNumber(result.realDataScenario.intensity, 2)} tCO₂e/ton
            </p>
            <p className="mt-1 font-tabular text-sm text-ink-muted">
              {formatEuro(result.realDataScenario.costEur)} / yıl
            </p>
          </div>
          <div className="rounded border border-warning/30 bg-warning/5 p-4">
            <p className="text-xs uppercase tracking-wide text-warning">
              AB varsayılan değeri (+%{formatNumber(result.defaultValueScenario.markupPercent, 0)} artırımlı)
            </p>
            <p className="mt-2 font-tabular text-xl font-semibold text-ink">
              {formatNumber(result.defaultValueScenario.intensity, 2)} tCO₂e/ton
            </p>
            <p className="mt-1 font-tabular text-sm text-ink-muted">
              {formatEuro(result.defaultValueScenario.costEur)} / yıl
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2026 – 2034 tahmini maliyet projeksiyonu</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
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
                <Line
                  type="monotone"
                  dataKey="realDataCostEur"
                  name="Gerçek veri"
                  stroke="#5b8dbe"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="defaultValueCostEur"
                  name="Varsayılan değer"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Serbest tahsisatın yıllar içinde azalması nedeniyle sertifika yükümlülüğüne tabi emisyon
            payı büyür; bu nedenle her iki senaryoda da maliyet zamanla artar.
          </p>
        </CardBody>
      </Card>

      <Card className="border-accent/40">
        <CardBody>
          <p className="font-heading text-lg font-semibold text-ink">
            Bu fark, AB müşterinin gözünde senin fiyat rekabetin demek.
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Gerçek tesis verinle çalışmak, hem ithalatçının maliyetini düşürür hem de seni
            varsayılan değerlerle fiyatlanan rakiplerine karşı avantajlı konuma taşır.
          </p>
        </CardBody>
      </Card>

      <div className="print:hidden">
        <Button variant="ghost" size="sm" onClick={onRestart}>
          Yeniden hesapla
        </Button>
      </div>
    </div>
  );
}
