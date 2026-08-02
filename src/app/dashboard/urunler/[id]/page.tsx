"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { AlertTriangle, ArrowLeft, Layers, Plus, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type Precursor, type Product, type ProductionProcess } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { PrecursorForm, type PrecursorFormValues } from "@/components/products/PrecursorForm";
import { uploadDocument } from "@/lib/documents";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/firebase";

const SOURCE_LABELS: Record<string, string> = {
  own_process: "Kendi tesisimde üretiliyor",
  supplier_with_data: "Tedarikçi verisi mevcut",
  supplier_no_data: "Tedarikçi verisi yok — varsayılan değer",
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { organization } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [precursors, setPrecursors] = useState<Precursor[]>([]);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestingPrecursorId, setRequestingPrecursorId] = useState<string | null>(null);
  const [supplierEmail, setSupplierEmail] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!params.id) return;
    const unsubProd = onSnapshot(doc(db, COLLECTIONS.products, params.id), (snap) => {
      if (snap.exists()) setProduct({ id: snap.id, ...(snap.data() as Omit<Product, "id">) });
      else router.push("/dashboard/urunler");
    });
    const unsubPrec = onSnapshot(
      query(collection(db, COLLECTIONS.precursors), where("productId", "==", params.id)),
      (snap) => setPrecursors(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Precursor, "id">) })))
    );
    return () => {
      unsubProd();
      unsubPrec();
    };
  }, [params.id, router]);

  useEffect(() => {
    if (!organization?.id) return;
    const unsubProc = onSnapshot(
      query(collection(db, COLLECTIONS.productionProcesses), where("organizationId", "==", organization.id)),
      (snap) => setProcesses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })))
    );
    return () => unsubProc();
  }, [organization?.id]);

  async function handleCreatePrecursor(values: PrecursorFormValues) {
    if (!organization || !product) return;
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, COLLECTIONS.precursors), {
        organizationId: organization.id,
        productId: product.id,
        name: values.name,
        sourceType: values.sourceType,
        quantityPerOutputTon: values.quantityPerOutputTon,
        ownProcessId: values.sourceType === "own_process" ? values.ownProcessId : null,
        supplierName: values.sourceType !== "own_process" ? values.supplierName || null : null,
        supplierEmissionValue:
          values.sourceType === "supplier_with_data" ? values.supplierEmissionValue : null,
        defaultValueUsed: values.sourceType === "supplier_no_data",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (values.file && auth.currentUser) {
        const documentId = await uploadDocument({
          organizationId: organization.id,
          file: values.file,
          relatedCollection: COLLECTIONS.precursors,
          relatedId: ref.id,
          uploadedBy: auth.currentUser.uid,
          installationId: product.installationId,
          docType: "tedarikci_beyani",
        });
        await updateDoc(doc(db, COLLECTIONS.precursors, ref.id), { supplierDocumentId: documentId });
      }

      await logAudit({ action: "create", collection: COLLECTIONS.precursors, documentId: ref.id });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendSupplierRequest(precursor: Precursor) {
    if (!organization || !product || !supplierEmail) return;
    setSendingRequest(true);
    try {
      const token = crypto.randomUUID();
      await setDoc(doc(db, COLLECTIONS.supplierRequests, token), {
        organizationId: organization.id,
        precursorId: precursor.id,
        productId: product.id,
        precursorName: precursor.name,
        organizationName: organization.name,
        supplierName: precursor.supplierName ?? "",
        supplierEmail,
        token,
        status: "gonderildi",
        sentAt: Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await fetch("/api/supplier-request/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: organization.name,
          supplierName: precursor.supplierName ?? "",
          supplierEmail,
          precursorName: precursor.name,
          token,
        }),
      });
      await logAudit({ action: "create", collection: COLLECTIONS.supplierRequests, documentId: token });
      setSentRequestIds((prev) => new Set(prev).add(precursor.id));
      setRequestingPrecursorId(null);
      setSupplierEmail("");
    } finally {
      setSendingRequest(false);
    }
  }

  if (!product || !organization) return null;

  return (
    <PageContainer
      title={product.name}
      description={`CN ${product.cnCode}`}
      actions={
        <Link href="/dashboard/urunler">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Ürünlere dön
          </Button>
        </Link>
      }
    >
      <Card className="mb-6">
        <CardBody className="grid gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Kapsam</p>
            <Badge tone={product.inScope ? "success" : "neutral"} className="mt-1">
              {product.inScope ? "CBAM kapsamında" : "Kapsam dışında"}
            </Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Yıllık üretim</p>
            <p className="mt-1 font-tabular text-ink">{product.annualProductionTon?.toLocaleString("tr-TR")} t</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">AB ihracatı</p>
            <p className="mt-1 font-tabular text-ink">{product.annualEuExportTon?.toLocaleString("tr-TR")} t</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Emtia kategorisi</p>
            <p className="mt-1 text-ink">{product.cbamGoodsCategory}</p>
          </div>
        </CardBody>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-ink">Öncü Ürünler</h2>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Öncü Ürün Ekle
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4 max-w-2xl">
          <CardBody>
            <PrecursorForm
              processes={processes}
              submitting={submitting}
              onSubmit={handleCreatePrecursor}
              onCancel={() => setShowForm(false)}
            />
          </CardBody>
        </Card>
      )}

      {precursors.length === 0 && !showForm ? (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            Bu ürün için henüz öncü ürün tanımlanmadı.
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3">
          {precursors.map((prec) => (
            <Card key={prec.id}>
              <CardBody className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Layers className="h-4 w-4 text-steel shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-ink">{prec.name}</h4>
                    <Badge tone={prec.sourceType === "supplier_no_data" ? "warning" : "steel"} className="mt-1">
                      {SOURCE_LABELS[prec.sourceType]}
                    </Badge>
                    <p className="mt-1.5 font-tabular text-xs text-ink-faint">
                      Tüketim oranı: {prec.quantityPerOutputTon} ton öncü / ton ürün
                    </p>
                    {prec.sourceType === "supplier_with_data" && prec.supplierEmissionValue != null && (
                      <p className="mt-1.5 font-tabular text-xs text-ink-muted">
                        {prec.supplierEmissionValue} tCO₂e/ton — {prec.supplierName}
                      </p>
                    )}
                    {prec.sourceType === "supplier_no_data" && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="h-3 w-3" /> Varsayılan değer hesaba yansıtılacak
                      </p>
                    )}
                    {requestingPrecursorId === prec.id && (
                      <div className="mt-3 flex items-end gap-2">
                        <div className="flex-1">
                          <Label>Tedarikçi e-postası</Label>
                          <Input
                            type="email"
                            value={supplierEmail}
                            onChange={(e) => setSupplierEmail(e.target.value)}
                            placeholder="tedarikci@firma.com"
                          />
                        </div>
                        <Button size="sm" onClick={() => handleSendSupplierRequest(prec)} disabled={sendingRequest || !supplierEmail}>
                          {sendingRequest ? "Gönderiliyor..." : "Gönder"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRequestingPrecursorId(null)}>
                          Vazgeç
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {prec.sourceType === "supplier_no_data" && requestingPrecursorId !== prec.id && (
                  <Button variant="secondary" size="sm" onClick={() => setRequestingPrecursorId(prec.id)}>
                    <Send className="h-3.5 w-3.5" /> {sentRequestIds.has(prec.id) ? "Tekrar gönder" : "Tedarikçiden veri iste"}
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
