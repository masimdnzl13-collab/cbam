"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { CheckCircle2, Download, FileSpreadsheet, Flame } from "lucide-react";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type ImporterPackage } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { generatePackagePdf } from "@/lib/packages/pdf";
import { generatePackageExcel } from "@/lib/packages/excel";
import * as XLSX from "xlsx";

const SCOPE_LABEL_EN: Record<string, string> = {
  direct_only: "Direct emissions only",
  direct_and_indirect: "Direct + indirect emissions",
};

export default function PublicPackagePage() {
  const params = useParams<{ token: string }>();
  const [pkg, setPkg] = useState<ImporterPackage | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (!params.token) return;
    getDoc(doc(db, COLLECTIONS.importerPackages, params.token)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      const data = { id: snap.id, ...(snap.data() as Omit<ImporterPackage, "id">) };
      setPkg(data);
      setAcknowledged(data.status === "onaylandi");
      fetch(`/api/importer-package/${params.token}/view`, { method: "POST" }).catch(() => {});
    });
  }, [params.token]);

  async function handleAcknowledge() {
    setAcknowledging(true);
    try {
      await fetch(`/api/importer-package/${params.token}/acknowledge`, { method: "POST" });
      setAcknowledged(true);
    } finally {
      setAcknowledging(false);
    }
  }

  function handleDownloadPdf() {
    if (!pkg) return;
    generatePackagePdf(pkg).save(`karbonrota-cbam-data-package-${pkg.periodYear}.pdf`);
  }

  function handleDownloadExcel() {
    if (!pkg) return;
    XLSX.writeFile(generatePackageExcel(pkg), `karbonrota-cbam-data-package-${pkg.periodYear}.xlsx`);
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-sm text-ink-muted">This package link is invalid or has expired.</p>
      </main>
    );
  }

  if (!pkg) {
    return (
      <main className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-sm text-ink-muted">Loading...</p>
      </main>
    );
  }

  const snapshot = pkg.dataSnapshot;

  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            <span className="font-heading text-base font-semibold tracking-wide">KarbonRota</span>
          </div>
          <span className="text-xs text-ink-faint">CBAM Data Package</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">
            CBAM Embedded Emissions Data Package
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {snapshot.producerName} — Reporting period {pkg.periodYear}
            {pkg.periodQuarter ? ` Q${pkg.periodQuarter}` : " (Annual)"} — Version {pkg.version}
          </p>
        </div>

        <Card>
          <CardBody className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleDownloadPdf}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDownloadExcel}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Download Excel
            </Button>
            <div className="flex-1" />
            {acknowledged ? (
              <Badge tone="success">
                <CheckCircle2 className="h-3 w-3" /> Receipt confirmed
              </Badge>
            ) : (
              <Button size="sm" variant="secondary" onClick={handleAcknowledge} disabled={acknowledging}>
                <CheckCircle2 className="h-3.5 w-3.5" /> {acknowledging ? "Confirming..." : "I received this data"}
              </Button>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Producer & Installations</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm text-ink-muted">
            <p>Producer: <span className="text-ink">{snapshot.producerName}</span></p>
            {snapshot.producerTaxId && <p>Tax ID: <span className="text-ink">{snapshot.producerTaxId}</span></p>}
            <p>Contact: <span className="text-ink">{snapshot.producerContactEmail}</span></p>
            <div className="pt-2 space-y-1">
              {snapshot.installations.map((i, idx) => (
                <p key={idx} className="text-ink">
                  {i.name} — {i.city}, {i.country} {i.unLocode ? `(${i.unLocode})` : ""}
                </p>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products & Embedded Emissions</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>CN Code</TH>
                <TH>Direct (tCO2e/t)</TH>
                <TH>Indirect (tCO2e/t)</TH>
                <TH>Scope</TH>
                <TH>Reported SEE</TH>
              </TR>
            </THead>
            <TBody>
              {snapshot.products.map((p) => (
                <TR key={p.productId}>
                  <TD>{p.name}</TD>
                  <TD className="font-tabular">{p.cnCode}</TD>
                  <TD className="font-tabular">{p.directEmissionsTco2PerTon.toFixed(3)}</TD>
                  <TD className="font-tabular">{p.indirectEmissionsTco2PerTon.toFixed(3)}</TD>
                  <TD><Badge tone="steel">{SCOPE_LABEL_EN[p.reportedScope]}</Badge></TD>
                  <TD className="font-tabular font-semibold text-accent">{p.reportedSpecificEmissions.toFixed(3)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        {snapshot.carbonPrices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Carbon Price Paid (Third Country)</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <TR>
                  <TH>Installation</TH>
                  <TH>Scheme</TH>
                  <TH>Amount paid</TH>
                  <TH>Effective price/ton</TH>
                </TR>
              </THead>
              <TBody>
                {snapshot.carbonPrices.map((c, i) => (
                  <TR key={i}>
                    <TD>{c.installationName}</TD>
                    <TD>{c.scheme}</TD>
                    <TD className="font-tabular">{c.amountPaid.toFixed(2)} {c.currency}</TD>
                    <TD className="font-tabular">{c.effectivePricePerTon.toFixed(2)} {c.currency}/t</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}

        {snapshot.approvedExplanations && snapshot.approvedExplanations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Period-over-Period Notes</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {snapshot.approvedExplanations.map((exp, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-ink">{exp.productName}</p>
                  <p className="text-sm text-ink-muted">{exp.summaryTr}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        <p className="text-center text-xs text-ink-faint pt-4">
          Generated by KarbonRota on behalf of {snapshot.producerName}.
        </p>
      </div>
    </main>
  );
}
