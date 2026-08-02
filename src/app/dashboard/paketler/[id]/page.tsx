"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { AlertTriangle, ArrowLeft, Copy, Download, Eye, FileSpreadsheet, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  COLLECTIONS,
  type CarbonPriceRecord,
  type DocumentRecord,
  type EmissionCalculation,
  type ImporterPackage,
  type Installation,
  type PeriodExplanation,
  type Precursor,
  type Product,
} from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { generatePackagePdf } from "@/lib/packages/pdf";
import { generatePackageExcel } from "@/lib/packages/excel";
import { buildPackageSnapshot } from "@/lib/packages/build-snapshot";
import { fetchLatestCalculationForProcess } from "@/lib/calculations/queries";
import { logAudit } from "@/lib/audit";
import { formatDateTR, formatNumber } from "@/lib/utils";
import * as XLSX from "xlsx";
import Link from "next/link";
import { getEffectiveLimits } from "@/lib/billing/limits";

const STATUS_LABELS: Record<string, string> = {
  taslak: "Taslak",
  gonderildi: "Gönderildi",
  goruntulendi: "Görüntülendi",
  onaylandi: "Onaylandı",
};

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { organization } = useAuth();
  const [pkg, setPkg] = useState<ImporterPackage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isStale, setIsStale] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const unsub = onSnapshot(doc(db, COLLECTIONS.importerPackages, params.id), (snap) => {
      if (snap.exists()) setPkg({ id: snap.id, ...(snap.data() as Omit<ImporterPackage, "id">) });
      else router.push("/dashboard/paketler");
    });
    return () => unsub();
  }, [params.id, router]);

  useEffect(() => {
    if (!organization?.id) return;
    const unsubProd = onSnapshot(
      query(collection(db, COLLECTIONS.products), where("organizationId", "==", organization.id)),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })))
    );
    const unsubInst = onSnapshot(
      query(collection(db, COLLECTIONS.installations), where("organizationId", "==", organization.id)),
      (snap) => setInstallations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })))
    );
    return () => {
      unsubProd();
      unsubInst();
    };
  }, [organization?.id]);

  useEffect(() => {
    if (!pkg || !organization) return;
    (async () => {
      const involvedProducts = products.filter((p) => pkg.productIds.includes(p.id));
      let stale = false;
      for (const product of involvedProducts) {
        const calc = await fetchLatestCalculationForProcess(organization.id, product.processId, pkg.periodYear);
        if (calc && calc.calculatedAt > pkg.dataSnapshot.generatedAt) {
          stale = true;
          break;
        }
      }
      setIsStale(stale);
    })();
  }, [pkg, products, organization]);

  const shareUrl = useMemo(() => (pkg ? `${window.location.origin}/paket/${pkg.shareToken}` : ""), [pkg]);

  async function handleRegenerate() {
    if (!pkg || !organization) return;
    setRegenerating(true);
    try {
      const selectedProducts = products.filter((p) => pkg.productIds.includes(p.id));

      const calculationsByProcess: Record<string, EmissionCalculation | undefined> = {};
      for (const product of selectedProducts) {
        calculationsByProcess[product.processId] =
          (await fetchLatestCalculationForProcess(organization.id, product.processId, pkg.periodYear)) ?? undefined;
      }

      const precursorsByProduct: Record<string, Precursor[]> = {};
      for (const product of selectedProducts) {
        const precSnap = await getDocs(query(collection(db, COLLECTIONS.precursors), where("productId", "==", product.id)));
        precursorsByProduct[product.id] = precSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Precursor, "id">) }));
      }

      const involvedInstallationIds = Array.from(new Set(selectedProducts.map((p) => p.installationId)));
      const carbonPricesByInstallation: Record<string, CarbonPriceRecord[]> = {};
      for (const instId of involvedInstallationIds) {
        const cpSnap = await getDocs(
          query(
            collection(db, COLLECTIONS.carbonPrices),
            where("organizationId", "==", organization.id),
            where("installationId", "==", instId),
            where("periodYear", "==", pkg.periodYear)
          )
        );
        carbonPricesByInstallation[instId] = cpSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarbonPriceRecord, "id">) }));
      }

      const relatedIds = [
        ...Object.values(calculationsByProcess).map((c) => c?.id).filter(Boolean),
        ...Object.values(precursorsByProduct).flat().map((p) => p.supplierDocumentId).filter(Boolean),
        ...Object.values(carbonPricesByInstallation).flat().map((c) => c.documentId).filter(Boolean),
      ] as string[];

      let documents: DocumentRecord[] = [];
      if (relatedIds.length > 0) {
        const docsSnap = await getDocs(query(collection(db, COLLECTIONS.documents), where("organizationId", "==", organization.id)));
        const allDocs = docsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentRecord, "id">) }));
        documents = allDocs.filter((d) => relatedIds.includes(d.id));
      }

      const explanationsByProcess: Record<string, PeriodExplanation | undefined> = {};
      for (const product of selectedProducts) {
        const calcId = calculationsByProcess[product.processId]?.id;
        if (!calcId) continue;
        const expSnap = await getDocs(
          query(collection(db, COLLECTIONS.periodExplanations), where("calculationId", "==", calcId), where("approved", "==", true))
        );
        if (!expSnap.empty) {
          const d = expSnap.docs[0];
          explanationsByProcess[product.processId] = { id: d.id, ...(d.data() as Omit<PeriodExplanation, "id">) };
        }
      }

      const snapshot = buildPackageSnapshot({
        organization,
        selectedProducts,
        installations,
        precursorsByProduct,
        calculationsByProcess,
        carbonPricesByInstallation,
        documents,
        explanationsByProcess,
      });

      await updateDoc(doc(db, COLLECTIONS.importerPackages, pkg.id), {
        dataSnapshot: snapshot,
        version: pkg.version + 1,
        watermarked: getEffectiveLimits(organization).packageWatermarked,
        viewCount: 0,
        lastViewedAt: null,
        acknowledgedAt: null,
        updatedAt: Date.now(),
      });
      await logAudit({
        action: "new_version",
        collection: COLLECTIONS.importerPackages,
        documentId: pkg.id,
        changeSummary: `v${pkg.version} -> v${pkg.version + 1}`,
      });
      setIsStale(false);
    } finally {
      setRegenerating(false);
    }
  }

  function handleDownloadPdf() {
    if (!pkg) return;
    const doc_ = generatePackagePdf(pkg);
    doc_.save(`karbonrota-paket-${pkg.buyerName}-${pkg.periodYear}.pdf`);
  }

  function handleDownloadExcel() {
    if (!pkg) return;
    const wb = generatePackageExcel(pkg);
    XLSX.writeFile(wb, `karbonrota-paket-${pkg.buyerName}-${pkg.periodYear}.xlsx`);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!pkg) return null;
  const snapshot = pkg.dataSnapshot;

  return (
    <PageContainer
      title={`Paket — ${pkg.buyerName}`}
      description={`${pkg.periodYear}${pkg.periodQuarter ? ` Ç${pkg.periodQuarter}` : ""} · v${pkg.version}`}
      actions={
        <Link href="/dashboard/paketler">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Paketlere dön
          </Button>
        </Link>
      }
    >
      {isStale && (
        <Card className="mb-5 border-warning/40">
          <CardBody className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="flex-1 text-sm text-ink-muted">
              Bu pakette güncel olmayan veri var — dahil edilen ürünlerden en az biri için daha
              yeni bir hesaplama mevcut. Paylaşmadan önce yeni sürüm oluşturmanı öneririz.
            </p>
            <Button size="sm" onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className="h-3.5 w-3.5" /> {regenerating ? "Oluşturuluyor..." : "Yeni Sürüm Oluştur"}
            </Button>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs text-ink-muted">Durum</p>
            <Badge tone={pkg.status === "onaylandi" ? "success" : "steel"} className="mt-1">
              {STATUS_LABELS[pkg.status]}
            </Badge>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-ink-muted">Görüntülenme</p>
            <p className="mt-1 font-tabular text-lg text-ink flex items-center gap-1"><Eye className="h-4 w-4 text-ink-faint" />{pkg.viewCount ?? 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-ink-muted">Son görüntülenme</p>
            <p className="mt-1 text-sm text-ink">{pkg.lastViewedAt ? formatDateTR(pkg.lastViewedAt) : "—"}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-ink-muted">Onay</p>
            <p className="mt-1 text-sm text-ink">{pkg.acknowledgedAt ? formatDateTR(pkg.acknowledgedAt) : "Bekleniyor"}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleDownloadPdf}>
            <Download className="h-3.5 w-3.5" /> PDF indir
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDownloadExcel}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel indir
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            <Copy className="h-3.5 w-3.5" /> {copied ? "Kopyalandı" : "Paylaşım linkini kopyala"}
          </Button>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Ürünler ve Gömülü Emisyon</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Ürün</TH>
              <TH>CN Kodu</TH>
              <TH>Doğrudan</TH>
              <TH>Dolaylı</TH>
              <TH>Kapsam</TH>
              <TH>Raporlanan SEE</TH>
            </TR>
          </THead>
          <TBody>
            {snapshot.products.map((p) => (
              <TR key={p.productId}>
                <TD>{p.name}</TD>
                <TD className="font-tabular">{p.cnCode}</TD>
                <TD className="font-tabular">{formatNumber(p.directEmissionsTco2PerTon, 3)}</TD>
                <TD className="font-tabular">{formatNumber(p.indirectEmissionsTco2PerTon, 3)}</TD>
                <TD>
                  <Badge tone={p.reportedScope === "direct_only" ? "steel" : "warning"}>
                    {p.reportedScope === "direct_only" ? "Yalnızca doğrudan" : "Doğrudan + dolaylı"}
                  </Badge>
                </TD>
                <TD className="font-tabular font-semibold text-accent">{formatNumber(p.reportedSpecificEmissions, 3)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {snapshot.carbonPrices.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Ödenen Karbon Fiyatı</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Tesis</TH>
                <TH>Sistem</TH>
                <TH>Dönem</TH>
                <TH>Tutar</TH>
                <TH>Efektif fiyat</TH>
              </TR>
            </THead>
            <TBody>
              {snapshot.carbonPrices.map((c, i) => (
                <TR key={i}>
                  <TD>{c.installationName}</TD>
                  <TD>{c.scheme}</TD>
                  <TD>{c.periodLabel}</TD>
                  <TD className="font-tabular">{formatNumber(c.amountPaid, 2)} {c.currency}</TD>
                  <TD className="font-tabular">{formatNumber(c.effectivePricePerTon, 2)} {c.currency}/t</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ekli Belgeler</CardTitle>
        </CardHeader>
        <CardBody>
          {snapshot.documents.length === 0 ? (
            <p className="text-sm text-ink-muted">Bu pakete bağlı belge yok.</p>
          ) : (
            <ul className="space-y-1 text-sm text-ink-muted">
              {snapshot.documents.map((d, i) => (
                <li key={i}>{d.fileName} — <span className="text-ink-faint">{d.relatedTo}</span></li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {snapshot.approvedExplanations && snapshot.approvedExplanations.length > 0 && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Dönemler Arası Notlar</CardTitle>
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
    </PageContainer>
  );
}
