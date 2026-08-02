"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { Plus, Factory, MapPin, Gauge } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type Installation, type ProductionProcess } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRODUCTION_ROUTE_LABELS } from "@/lib/config/process-templates";
import { calcInstallationCompleteness } from "@/lib/facilities/completeness";
import { InstallationForm, type InstallationFormValues } from "@/components/facilities/InstallationForm";
import { logAudit } from "@/lib/audit";
import { checkLimit } from "@/lib/billing/limits";
import { UpgradeWall } from "@/components/billing/UpgradeWall";

export default function InstallationsPage() {
  const { organization } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    const unsubInst = onSnapshot(
      query(collection(db, COLLECTIONS.installations), where("organizationId", "==", organization.id)),
      (snap) => setInstallations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })))
    );
    const unsubProc = onSnapshot(
      query(collection(db, COLLECTIONS.productionProcesses), where("organizationId", "==", organization.id)),
      (snap) => setProcesses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })))
    );
    return () => {
      unsubInst();
      unsubProc();
    };
  }, [organization?.id]);

  async function handleCreate(values: InstallationFormValues) {
    if (!organization) return;
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, COLLECTIONS.installations), {
        organizationId: organization.id,
        name: values.name,
        city: values.city,
        country: "Türkiye",
        address: values.address || null,
        lat: values.lat ? Number(values.lat) : null,
        lng: values.lng ? Number(values.lng) : null,
        unLocode: values.unLocode || null,
        productionRouteType: values.productionRouteType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit({ action: "create", collection: COLLECTIONS.installations, documentId: ref.id });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!organization) return null;

  const limitCheck = checkLimit(organization, "maxInstallations", installations.length);

  return (
    <PageContainer
      title="Tesisler"
      description="Üretim tesislerini ve rotalarını yönet."
      actions={
        <Button onClick={() => setShowForm((v) => !v)} disabled={!limitCheck.allowed}>
          <Plus className="h-4 w-4" /> Yeni Tesis
        </Button>
      }
    >
      {!limitCheck.allowed && (
        <div className="mb-6">
          <UpgradeWall
            message={`Planın ${limitCheck.limit} tesis ile sınırlı. Yeni tesis eklemek için yükseltme yapmalısın.`}
            currentPlan={limitCheck.plan}
          />
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardBody>
            <InstallationForm
              sector={organization.sector}
              submitting={submitting}
              submitLabel="Tesisi Kaydet"
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </CardBody>
        </Card>
      )}

      {installations.length === 0 && !showForm && (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            Henüz tesis kaydın yok. &quot;Yeni Tesis&quot; ile ilk tesisini ekle.
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {installations.map((inst) => {
          const instProcesses = processes.filter((p) => p.installationId === inst.id);
          const completeness = calcInstallationCompleteness(inst, instProcesses);
          return (
            <Link key={inst.id} href={`/dashboard/tesisler/${inst.id}`}>
              <Card className="h-full hover:border-steel/50 transition-colors">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <Factory className="h-5 w-5 text-steel" />
                    <Badge tone={completeness === 100 ? "success" : completeness >= 50 ? "warning" : "danger"}>
                      %{completeness} tam
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-heading text-sm font-semibold text-ink">{inst.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                    <MapPin className="h-3 w-3" /> {inst.city}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    {PRODUCTION_ROUTE_LABELS[inst.productionRouteType] ?? inst.productionRouteType}
                  </p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-ink-faint">
                    <Gauge className="h-3 w-3" /> {instProcesses.length} proses tanımlı
                  </p>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
