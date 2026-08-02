"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { Plus, Send, Eye, CheckCircle2 } from "lucide-react";
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
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { buildPackageSnapshot } from "@/lib/packages/build-snapshot";
import { fetchLatestCalculationForProcess } from "@/lib/calculations/queries";
import { logAudit } from "@/lib/audit";
import { formatDateTR } from "@/lib/utils";
import { getEffectiveLimits } from "@/lib/billing/limits";

const CURRENT_YEAR = new Date().getFullYear();

const STATUS_LABELS: Record<string, string> = {
  taslak: "Taslak",
  gonderildi: "Gönderildi",
  goruntulendi: "Görüntülendi",
  onaylandi: "Onaylandı",
};

export default function ImporterPackagesPage() {
  const { organization } = useAuth();
  const [packages, setPackages] = useState<ImporterPackage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [periodYear, setPeriodYear] = useState(CURRENT_YEAR);
  const [periodQuarter, setPeriodQuarter] = useState("yillik");
  const [buyerName, setBuyerName] = useState("");
  const [buyerCountry, setBuyerCountry] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!organization?.id) return;
    const unsubPkg = onSnapshot(
      query(collection(db, COLLECTIONS.importerPackages), where("organizationId", "==", organization.id)),
      (snap) => setPackages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImporterPackage, "id">) })))
    );
    const unsubProd = onSnapshot(
      query(collection(db, COLLECTIONS.products), where("organizationId", "==", organization.id)),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })))
    );
    const unsubInst = onSnapshot(
      query(collection(db, COLLECTIONS.installations), where("organizationId", "==", organization.id)),
      (snap) => setInstallations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })))
    );
    return () => {
      unsubPkg();
      unsubProd();
      unsubInst();
    };
  }, [organization?.id]);

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!organization || selectedProductIds.length === 0) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const quarterValue = periodQuarter === "yillik" ? null : Number(periodQuarter);
      const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

      const calculationsByProcess: Record<string, EmissionCalculation | undefined> = {};
      for (const product of selectedProducts) {
        calculationsByProcess[product.processId] = (
          await fetchLatestCalculationForProcess(organization.id, product.processId, periodYear)
        ) ?? undefined;
      }

      const missingCalc = selectedProducts.filter((p) => !calculationsByProcess[p.processId]);
      if (missingCalc.length > 0) {
        setNotice(
          `Şu ürünler için ${periodYear} dönemine ait hesaplama bulunamadı, önce Hesaplamalar bölümünden hesapla: ${missingCalc
            .map((p) => p.name)
            .join(", ")}`
        );
        setSubmitting(false);
        return;
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
            where("periodYear", "==", periodYear)
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
        const docsSnap = await getDocs(
          query(collection(db, COLLECTIONS.documents), where("organizationId", "==", organization.id))
        );
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

      const token = crypto.randomUUID();
      await setDoc(doc(db, COLLECTIONS.importerPackages, token), {
        organizationId: organization.id,
        productIds: selectedProductIds,
        periodYear,
        periodQuarter: quarterValue,
        buyerName,
        buyerCountry,
        buyerContact,
        shareToken: token,
        status: "taslak",
        version: 1,
        watermarked: getEffectiveLimits(organization).packageWatermarked,
        dataSnapshot: snapshot,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await logAudit({ action: "create", collection: COLLECTIONS.importerPackages, documentId: token });
      setShowForm(false);
      setSelectedProductIds([]);
      setBuyerName("");
      setBuyerCountry("");
      setBuyerContact("");
    } finally {
      setSubmitting(false);
    }
  }

  if (!organization) return null;

  return (
    <PageContainer
      title="İthalatçı Paketleri"
      description="AB müşterine gönderilecek gömülü emisyon veri paketini derle."
      actions={
        <Button onClick={() => setShowForm((v) => !v)} disabled={products.length === 0}>
          <Plus className="h-4 w-4" /> Yeni Paket
        </Button>
      }
    >
      {showForm && (
        <Card className="mb-6 max-w-2xl">
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Ürünler</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 rounded border border-base-border bg-base-surface2 px-3 py-2 text-sm text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="accent-accent"
                      />
                      {p.name} <span className="text-ink-faint font-tabular">({p.cnCode})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Dönem yılı</Label>
                  <Input type="number" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Alt kırılım</Label>
                  <select
                    className="w-full rounded bg-base-surface2 border border-base-border px-3 py-2 text-sm text-ink"
                    value={periodQuarter}
                    onChange={(e) => setPeriodQuarter(e.target.value)}
                  >
                    <option value="yillik">Yıllık</option>
                    <option value="1">Ç1</option>
                    <option value="2">Ç2</option>
                    <option value="3">Ç3</option>
                    <option value="4">Ç4</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>İthalatçı firma adı</Label>
                  <Input required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                </div>
                <div>
                  <Label>Ülke</Label>
                  <Input required value={buyerCountry} onChange={(e) => setBuyerCountry(e.target.value)} />
                </div>
                <div>
                  <Label>İletişim (e-posta)</Label>
                  <Input required type="email" value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} />
                </div>
              </div>
              {notice && <p className="text-sm text-warning">{notice}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || selectedProductIds.length === 0}>
                  {submitting ? "Derleniyor..." : "Paketi Derle"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Vazgeç
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {packages.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            <Send className="mx-auto h-6 w-6 text-ink-faint mb-2" />
            Henüz paket oluşturulmadı.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>İthalatçı</TH>
                <TH>Dönem</TH>
                <TH>Durum</TH>
                <TH>Sürüm</TH>
                <TH>Görüntülenme</TH>
                <TH>Oluşturulma</TH>
              </TR>
            </THead>
            <TBody>
              {packages.map((pkg) => (
                <TR key={pkg.id}>
                  <TD>
                    <Link href={`/dashboard/paketler/${pkg.id}`} className="text-ink hover:text-accent font-medium">
                      {pkg.buyerName}
                    </Link>
                    <p className="text-xs text-ink-faint">{pkg.buyerCountry}</p>
                  </TD>
                  <TD className="font-tabular">{pkg.periodYear}{pkg.periodQuarter ? ` Ç${pkg.periodQuarter}` : ""}</TD>
                  <TD>
                    <Badge tone={pkg.status === "onaylandi" ? "success" : pkg.status === "goruntulendi" ? "steel" : "neutral"}>
                      {pkg.status === "onaylandi" && <CheckCircle2 className="h-3 w-3" />}
                      {STATUS_LABELS[pkg.status]}
                    </Badge>
                  </TD>
                  <TD className="font-tabular">v{pkg.version}</TD>
                  <TD className="font-tabular flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-ink-faint" /> {pkg.viewCount ?? 0}</TD>
                  <TD>{pkg.createdAt ? formatDateTR(pkg.createdAt) : "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}
