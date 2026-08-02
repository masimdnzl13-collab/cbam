"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { AlertTriangle, ArrowLeft, Plus, ScrollText } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type Installation, type ProductionProcess } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InstallationForm, type InstallationFormValues } from "@/components/facilities/InstallationForm";
import { ProcessForm, type ProcessFormValues } from "@/components/facilities/ProcessForm";
import { logAudit } from "@/lib/audit";
import Link from "next/link";

type Tab = "genel" | "prosesler";

export default function InstallationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { organization } = useAuth();
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [tab, setTab] = useState<Tab>("genel");
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const unsubInst = onSnapshot(doc(db, COLLECTIONS.installations, params.id), (snap) => {
      if (snap.exists()) setInstallation({ id: snap.id, ...(snap.data() as Omit<Installation, "id">) });
      else router.push("/dashboard/tesisler");
    });
    const unsubProc = onSnapshot(
      query(collection(db, COLLECTIONS.productionProcesses), where("installationId", "==", params.id)),
      (snap) => setProcesses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })))
    );
    return () => {
      unsubInst();
      unsubProc();
    };
  }, [params.id, router]);

  async function handleUpdateInstallation(values: InstallationFormValues) {
    if (!installation) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.installations, installation.id), {
        name: values.name,
        city: values.city,
        address: values.address || null,
        lat: values.lat ? Number(values.lat) : null,
        lng: values.lng ? Number(values.lng) : null,
        unLocode: values.unLocode || null,
        productionRouteType: values.productionRouteType,
        updatedAt: serverTimestamp(),
      });
      await logAudit({
        action: "update",
        collection: COLLECTIONS.installations,
        documentId: installation.id,
        changeSummary: "Genel bilgiler güncellendi",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateProcess(values: ProcessFormValues) {
    if (!organization || !installation) return;
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, COLLECTIONS.productionProcesses), {
        organizationId: organization.id,
        installationId: installation.id,
        name: values.name,
        templateKey: values.templateKey,
        sector: organization.sector,
        systemBoundaryDescription: values.systemBoundaryDescription,
        isFinishingProcess: values.isFinishingProcess,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit({ action: "create", collection: COLLECTIONS.productionProcesses, documentId: ref.id });
      setShowProcessForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!installation || !organization) return null;

  return (
    <PageContainer
      title={installation.name}
      description={installation.city}
      actions={
        <Link href="/dashboard/tesisler">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Tesislere dön
          </Button>
        </Link>
      }
    >
      <div className="mb-5 flex gap-1 border-b border-base-border">
        {[
          { key: "genel" as Tab, label: "Genel Bilgiler" },
          { key: "prosesler" as Tab, label: `Prosesler (${processes.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "genel" && (
        <Card className="max-w-2xl">
          <CardBody>
            <InstallationForm
              sector={organization.sector}
              initial={installation}
              submitting={submitting}
              submitLabel="Değişiklikleri Kaydet"
              onSubmit={handleUpdateInstallation}
            />
          </CardBody>
        </Card>
      )}

      {tab === "prosesler" && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowProcessForm((v) => !v)}>
              <Plus className="h-4 w-4" /> Proses Ekle
            </Button>
          </div>

          {showProcessForm && (
            <Card className="mb-4 max-w-2xl">
              <CardBody>
                <ProcessForm
                  sector={organization.sector}
                  submitting={submitting}
                  onSubmit={handleCreateProcess}
                  onCancel={() => setShowProcessForm(false)}
                />
              </CardBody>
            </Card>
          )}

          {processes.length === 0 && !showProcessForm && (
            <Card>
              <CardBody className="text-center py-10 text-sm text-ink-muted">
                Bu tesiste henüz proses tanımlanmadı.
              </CardBody>
            </Card>
          )}

          <div className="grid gap-3">
            {processes.map((p) => (
              <Card key={p.id}>
                <CardBody className="flex items-start gap-3">
                  <ScrollText className="h-4 w-4 text-steel shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-sm font-semibold text-ink">{p.name}</h4>
                      {p.isFinishingProcess && (
                        <Badge tone="warning">
                          <AlertTriangle className="h-3 w-3" /> Bitirme prosesi — kapsam dışı
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                      {p.systemBoundaryDescription}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
