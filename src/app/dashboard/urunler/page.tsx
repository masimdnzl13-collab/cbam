"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { Plus, Package } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type Installation, type Product, type ProductionProcess } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { ProductForm, type ProductFormValues } from "@/components/products/ProductForm";
import { lookupCnCode } from "@/lib/config/cn-code-mapping";
import { logAudit } from "@/lib/audit";
import { checkLimit } from "@/lib/billing/limits";
import { UpgradeWall } from "@/components/billing/UpgradeWall";

export default function ProductsPage() {
  const { organization } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    const unsubProc = onSnapshot(
      query(collection(db, COLLECTIONS.productionProcesses), where("organizationId", "==", organization.id)),
      (snap) => setProcesses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })))
    );
    return () => {
      unsubProd();
      unsubInst();
      unsubProc();
    };
  }, [organization?.id]);

  async function handleCreate(values: ProductFormValues) {
    if (!organization) return;
    setSubmitting(true);
    try {
      const lookup = lookupCnCode(values.cnCode);
      const ref = await addDoc(collection(db, COLLECTIONS.products), {
        organizationId: organization.id,
        name: values.name,
        cnCode: values.cnCode,
        cbamGoodsCategory: lookup.matched ? lookup.entry!.category : "kapsam_disi",
        inScope: lookup.matched,
        installationId: values.installationId,
        processId: values.processId,
        annualProductionTon: values.annualProductionTon,
        annualEuExportTon: values.annualEuExportTon,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit({ action: "create", collection: COLLECTIONS.products, documentId: ref.id });
      if (!organization.onboardingChecklist?.productsMapped) {
        await updateDoc(doc(db, COLLECTIONS.organizations, organization.id), {
          "onboardingChecklist.productsMapped": true,
        });
      }
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!organization) return null;

  const limitCheck = checkLimit(organization, "maxProductsPerPeriod", products.length);

  return (
    <PageContainer
      title="Ürünler"
      description="AB'ye ihraç ettiğin ürünleri CN koduyla eşle."
      actions={
        <Button onClick={() => setShowForm((v) => !v)} disabled={installations.length === 0 || !limitCheck.allowed}>
          <Plus className="h-4 w-4" /> Yeni Ürün
        </Button>
      }
    >
      {!limitCheck.allowed && (
        <div className="mb-6">
          <UpgradeWall
            message={`Planın en fazla ${limitCheck.limit} ürün kaydına izin veriyor.`}
            currentPlan={limitCheck.plan}
          />
        </div>
      )}

      {installations.length === 0 && (
        <Card className="mb-6">
          <CardBody className="text-sm text-ink-muted">
            Ürün ekleyebilmek için önce en az bir tesis kaydetmen gerekiyor.
          </CardBody>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6 max-w-2xl">
          <CardBody>
            <ProductForm
              installations={installations}
              processes={processes}
              submitting={submitting}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </CardBody>
        </Card>
      )}

      {products.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            <Package className="mx-auto h-6 w-6 text-ink-faint mb-2" />
            Henüz ürün kaydın yok.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Ürün</TH>
                <TH>CN Kodu</TH>
                <TH>Kapsam</TH>
                <TH>Tesis</TH>
                <TH>Yıllık Üretim</TH>
                <TH>AB İhracatı</TH>
              </TR>
            </THead>
            <TBody>
              {products.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <Link href={`/dashboard/urunler/${p.id}`} className="text-ink hover:text-accent font-medium">
                      {p.name}
                    </Link>
                  </TD>
                  <TD className="font-tabular">{p.cnCode}</TD>
                  <TD>
                    <Badge tone={p.inScope ? "success" : "neutral"}>
                      {p.inScope ? "CBAM kapsamında" : "Kapsam dışında"}
                    </Badge>
                  </TD>
                  <TD>{installations.find((i) => i.id === p.installationId)?.name ?? "-"}</TD>
                  <TD className="font-tabular">{p.annualProductionTon?.toLocaleString("tr-TR")} t</TD>
                  <TD className="font-tabular">{p.annualEuExportTon?.toLocaleString("tr-TR")} t</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}
