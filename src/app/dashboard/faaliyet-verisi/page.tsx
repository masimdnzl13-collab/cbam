"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Lock, LockOpen, Copy, Save, Upload, ShieldQuestion, AlertTriangle } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  COLLECTIONS,
  type ActivityData,
  type ElectricityEntry,
  type FuelEntry,
  type InputMaterialEntry,
  type Installation,
  type ProductionProcess,
} from "@/lib/types";
import type { LogicAuditResult } from "@/lib/ai/schemas";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { FuelRows } from "@/components/activity-data/FuelRows";
import { ElectricityBlock } from "@/components/activity-data/ElectricityBlock";
import { InputMaterialRows } from "@/components/activity-data/InputMaterialRows";
import { calcActivityDataCompleteness } from "@/lib/activity-data/completeness";
import { uploadDocument } from "@/lib/documents";
import { logAudit } from "@/lib/audit";
import { ImportDataModal, type ImportResult } from "@/components/import/ImportDataModal";

const CURRENT_YEAR = new Date().getFullYear();

type DraftState = {
  id: string | null;
  version: number;
  isLocked: boolean;
  fuels: FuelEntry[];
  electricity?: ElectricityEntry;
  inputMaterials: InputMaterialEntry[];
  outputQuantityTon: number;
};

const BLANK_DRAFT: DraftState = {
  id: null,
  version: 1,
  isLocked: false,
  fuels: [],
  electricity: undefined,
  inputMaterials: [],
  outputQuantityTon: 0,
};

export default function ActivityDataPage() {
  const { organization } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);

  const [installationId, setInstallationId] = useState("");
  const [processId, setProcessId] = useState("");
  const [periodYear, setPeriodYear] = useState(CURRENT_YEAR);
  const [periodQuarter, setPeriodQuarter] = useState<string>("yillik");

  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState<DraftState>(BLANK_DRAFT);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<LogicAuditResult | null>(null);
  const [findingExplanations, setFindingExplanations] = useState<Record<number, string>>({});

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

  const availableProcesses = processes.filter((p) => p.installationId === installationId);
  const quarterValue = periodQuarter === "yillik" ? null : Number(periodQuarter);

  async function handleOpenPeriod() {
    if (!organization || !installationId || !processId) return;
    const q = query(
      collection(db, COLLECTIONS.activityData),
      where("organizationId", "==", organization.id),
      where("installationId", "==", installationId),
      where("processId", "==", processId),
      where("periodYear", "==", periodYear),
      where("periodQuarter", "==", quarterValue)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityData, "id">) }))
        .sort((a, b) => b.version - a.version);
      const latest = docs[0];
      setDraft({
        id: latest.id,
        version: latest.version,
        isLocked: latest.isLocked,
        fuels: latest.fuels ?? [],
        electricity: latest.electricity,
        inputMaterials: latest.inputMaterials ?? [],
        outputQuantityTon: latest.outputQuantityTon ?? 0,
      });
    } else {
      const ref = await addDoc(collection(db, COLLECTIONS.activityData), {
        organizationId: organization.id,
        installationId,
        processId,
        periodYear,
        periodQuarter: quarterValue,
        fuels: [],
        inputMaterials: [],
        outputQuantityTon: 0,
        isDraft: true,
        isLocked: false,
        version: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setDraft({ ...BLANK_DRAFT, id: ref.id });
    }
    setOpened(true);
  }

  function scheduleSave(next: DraftState) {
    setDraft(next);
    if (next.isLocked || !next.id) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateDoc(doc(db, COLLECTIONS.activityData, next.id!), {
        fuels: next.fuels,
        electricity: next.electricity ?? null,
        inputMaterials: next.inputMaterials,
        outputQuantityTon: next.outputQuantityTon,
        isDraft: true,
        updatedAt: serverTimestamp(),
      });
      setSaveStatus("saved");
      if (organization && !organization.onboardingChecklist?.firstActivityDataEntered) {
        await updateDoc(doc(db, COLLECTIONS.organizations, organization.id), {
          "onboardingChecklist.firstActivityDataEntered": true,
        });
      }
    }, 1200);
  }

  async function handleCopyPreviousPeriod() {
    if (!organization || !installationId || !processId) return;
    const q = query(
      collection(db, COLLECTIONS.activityData),
      where("organizationId", "==", organization.id),
      where("installationId", "==", installationId),
      where("processId", "==", processId),
      where("periodYear", "==", periodYear - 1),
      where("periodQuarter", "==", quarterValue)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const docs = snap.docs
      .map((d) => d.data() as ActivityData)
      .sort((a, b) => b.version - a.version);
    const prev = docs[0];
    scheduleSave({
      ...draft,
      fuels: prev.fuels ?? [],
      electricity: prev.electricity,
      inputMaterials: prev.inputMaterials ?? [],
      outputQuantityTon: prev.outputQuantityTon ?? 0,
    });
  }

  async function handleOpenAuditModal() {
    if (!organization) return;
    setShowAuditModal(true);
    setAuditLoading(true);
    setAuditResult(null);
    try {
      const installation = installations.find((i) => i.id === installationId);
      const res = await fetch("/api/ai/audit-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: organization.sector,
          productionRouteType: installation?.productionRouteType ?? "diger",
          activityData: {
            fuels: draft.fuels,
            electricity: draft.electricity,
            inputMaterials: draft.inputMaterials,
            outputQuantityTon: draft.outputQuantityTon,
          },
        }),
      });
      const data = await res.json();
      setAuditResult(data.result ?? null);
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleConfirmLock() {
    if (!draft.id) return;
    await updateDoc(doc(db, COLLECTIONS.activityData, draft.id), {
      isLocked: true,
      isDraft: false,
      updatedAt: serverTimestamp(),
    });
    const notesSummary = Object.entries(findingExplanations)
      .filter(([, v]) => v.trim())
      .map(([i, v]) => `[${auditResult?.findings[Number(i)]?.titleTr}] ${v}`)
      .join(" | ");
    await logAudit({
      action: "lock",
      collection: COLLECTIONS.activityData,
      documentId: draft.id,
      changeSummary: notesSummary || undefined,
    });
    setDraft({ ...draft, isLocked: true });
    setShowAuditModal(false);
    setAuditResult(null);
    setFindingExplanations({});
  }

  async function handleOpenNewVersion() {
    if (!organization || !draft.id) return;
    const ref = await addDoc(collection(db, COLLECTIONS.activityData), {
      organizationId: organization.id,
      installationId,
      processId,
      periodYear,
      periodQuarter: quarterValue,
      fuels: draft.fuels,
      electricity: draft.electricity ?? null,
      inputMaterials: draft.inputMaterials,
      outputQuantityTon: draft.outputQuantityTon,
      isDraft: true,
      isLocked: false,
      version: draft.version + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAudit({ action: "new_version", collection: COLLECTIONS.activityData, documentId: ref.id });
    setDraft({ ...draft, id: ref.id, version: draft.version + 1, isLocked: false });
  }

  async function handleUploadFuelDoc(index: number, file: File) {
    if (!organization || !draft.id || !auth.currentUser) return;
    const fuel = draft.fuels[index];
    const documentId = await uploadDocument({
      organizationId: organization.id,
      file,
      relatedCollection: COLLECTIONS.activityData,
      relatedId: draft.id,
      uploadedBy: auth.currentUser.uid,
      installationId,
      periodYear,
      docType: "yakit_belgesi",
      expectedDocTypeDescription: `Yakıt tüketim belgesi (fatura veya irsaliye) — yakıt türü: ${fuel?.fuelType}`,
      expectedAmount: fuel?.quantity,
      expectedUnit: fuel?.unit,
    });
    const next = [...draft.fuels];
    next[index] = { ...next[index], documentId };
    scheduleSave({ ...draft, fuels: next });
  }

  async function handleUploadMaterialDoc(index: number, file: File) {
    if (!organization || !draft.id || !auth.currentUser) return;
    const material = draft.inputMaterials[index];
    const documentId = await uploadDocument({
      organizationId: organization.id,
      file,
      relatedCollection: COLLECTIONS.activityData,
      relatedId: draft.id,
      uploadedBy: auth.currentUser.uid,
      installationId,
      periodYear,
      docType: "girdi_malzemesi_belgesi",
      expectedDocTypeDescription: `Girdi malzemesi (hammadde) irsaliyesi — malzeme: ${material?.materialName}`,
      expectedAmount: material?.quantity,
      expectedUnit: material?.unit,
    });
    const next = [...draft.inputMaterials];
    next[index] = { ...next[index], documentId };
    scheduleSave({ ...draft, inputMaterials: next });
  }

  async function handleUploadPpaDoc(file: File) {
    if (!organization || !draft.id || !auth.currentUser || !draft.electricity) return;
    const documentId = await uploadDocument({
      organizationId: organization.id,
      file,
      relatedCollection: COLLECTIONS.activityData,
      relatedId: draft.id,
      uploadedBy: auth.currentUser.uid,
      installationId,
      periodYear,
      docType: "ppa_sozlesmesi",
      expectedDocTypeDescription: "Yenilenebilir enerji PPA (Güç Alım Anlaşması) sözleşmesi",
    });
    scheduleSave({ ...draft, electricity: { ...draft.electricity, ppaDocumentId: documentId } });
  }

  async function handleImportResult(result: ImportResult) {
    const next: DraftState = {
      ...draft,
      fuels: [...draft.fuels, ...result.fuels],
      inputMaterials: [...draft.inputMaterials, ...result.inputMaterials],
      electricity: result.electricity ?? draft.electricity,
      outputQuantityTon: result.outputQuantityTon ?? draft.outputQuantityTon,
    };
    scheduleSave(next);
    if (draft.id) {
      const channel = result.fuels[0]?.importSource ?? result.inputMaterials[0]?.importSource ?? result.electricity?.importSource ?? "manual";
      await logAudit({
        action: "import",
        collection: COLLECTIONS.activityData,
        documentId: draft.id,
        changeSummary: `${channel} kanalından veri içe aktarıldı`,
      });
    }
    setShowImportModal(false);
  }

  const completeness = useMemo(() => calcActivityDataCompleteness(draft), [draft]);

  if (!organization) return null;

  return (
    <PageContainer
      title="Faaliyet Verisi"
      description="Dönem bazlı yakıt, elektrik ve girdi malzemesi verilerini gir."
    >
      <Card className="mb-6 max-w-3xl">
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label>Tesis</Label>
              <Select
                value={installationId}
                onChange={(e) => {
                  setInstallationId(e.target.value);
                  setProcessId("");
                  setOpened(false);
                }}
              >
                <option value="">Seç...</option>
                {installations.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Proses</Label>
              <Select value={processId} onChange={(e) => { setProcessId(e.target.value); setOpened(false); }}>
                <option value="">Seç...</option>
                {availableProcesses.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Dönem yılı</Label>
              <Input
                type="number"
                value={periodYear}
                onChange={(e) => { setPeriodYear(Number(e.target.value)); setOpened(false); }}
              />
            </div>
            <div>
              <Label>Alt kırılım</Label>
              <Select value={periodQuarter} onChange={(e) => { setPeriodQuarter(e.target.value); setOpened(false); }}>
                <option value="yillik">Yıllık</option>
                <option value="1">Ç1</option>
                <option value="2">Ç2</option>
                <option value="3">Ç3</option>
                <option value="4">Ç4</option>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleOpenPeriod} disabled={!installationId || !processId}>
              Bu Dönemi Aç
            </Button>
          </div>
        </CardBody>
      </Card>

      {opened && (
        <div className="max-w-3xl space-y-4">
          <Card>
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-ink-muted">Tamamlanma</span>
                  <Badge tone={draft.isLocked ? "neutral" : completeness === 100 ? "success" : "warning"}>
                    {draft.isLocked ? `Kilitli — v${draft.version}` : `%${completeness} — v${draft.version}`}
                  </Badge>
                </div>
                <div className="h-1.5 w-full rounded bg-base-surface2">
                  <div
                    className="h-1.5 rounded bg-accent transition-all"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {saveStatus !== "idle" && !draft.isLocked && (
                  <span className="flex items-center gap-1 text-xs text-ink-faint">
                    <Save className="h-3.5 w-3.5" /> {saveStatus === "saving" ? "Kaydediliyor..." : "Kaydedildi"}
                  </span>
                )}
                <Button variant="secondary" size="sm" onClick={handleCopyPreviousPeriod} disabled={draft.isLocked}>
                  <Copy className="h-3.5 w-3.5" /> Geçen dönemi kopyala
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)} disabled={draft.isLocked}>
                  <Upload className="h-3.5 w-3.5" /> İçe Aktar
                </Button>
                {draft.isLocked ? (
                  <Button variant="secondary" size="sm" onClick={handleOpenNewVersion}>
                    <LockOpen className="h-3.5 w-3.5" /> Yeni Sürüm Aç
                  </Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={handleOpenAuditModal}>
                    <Lock className="h-3.5 w-3.5" /> Dönemi Kilitle
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          <fieldset disabled={draft.isLocked} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Yakıtlar</CardTitle>
              </CardHeader>
              <CardBody>
                <FuelRows
                  fuels={draft.fuels}
                  onChange={(fuels) => scheduleSave({ ...draft, fuels })}
                  onUploadDocument={handleUploadFuelDoc}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Elektrik</CardTitle>
              </CardHeader>
              <CardBody>
                <ElectricityBlock
                  value={draft.electricity}
                  onChange={(electricity) => scheduleSave({ ...draft, electricity })}
                  onUploadPpaDocument={handleUploadPpaDoc}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Girdi Malzemeleri</CardTitle>
              </CardHeader>
              <CardBody>
                <InputMaterialRows
                  materials={draft.inputMaterials}
                  onChange={(inputMaterials) => scheduleSave({ ...draft, inputMaterials })}
                  onUploadDocument={handleUploadMaterialDoc}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Üretim Çıktısı</CardTitle>
              </CardHeader>
              <CardBody className="max-w-xs">
                <Label>Üretim çıktı miktarı (ton)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.outputQuantityTon}
                  onChange={(e) => scheduleSave({ ...draft, outputQuantityTon: Number(e.target.value) })}
                />
              </CardBody>
            </Card>
          </fieldset>
        </div>
      )}

      {showImportModal && (
        <ImportDataModal onClose={() => setShowImportModal(false)} onImport={handleImportResult} />
      )}

      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <ShieldQuestion className="h-5 w-5 text-steel" />
                <h2 className="font-heading text-lg font-semibold text-ink">Dönem Kilitleme Ön Kontrolü</h2>
              </div>

              {auditLoading && <p className="text-sm text-ink-muted">Veriler taranıyor...</p>}

              {auditResult && (
                <div className="space-y-4">
                  <p className="text-sm text-ink-muted">{auditResult.overallAssessmentTr}</p>

                  {auditResult.findings.length === 0 ? (
                    <p className="text-sm text-success">Bir tutarsızlık bulunamadı.</p>
                  ) : (
                    <div className="space-y-3">
                      {auditResult.findings.map((f, i) => (
                        <div key={i} className="rounded border border-base-border bg-base-surface2 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle
                              className={`h-4 w-4 ${f.severity === "kritik" ? "text-danger" : f.severity === "uyari" ? "text-warning" : "text-steel"}`}
                            />
                            <span className="text-sm font-medium text-ink">{f.titleTr}</span>
                            <Badge tone={f.severity === "kritik" ? "danger" : f.severity === "uyari" ? "warning" : "steel"}>
                              {f.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-muted mb-2">{f.descriptionTr}</p>
                          <Label>Açıklama (opsiyonel — denetim izine kaydedilir)</Label>
                          <Textarea
                            rows={2}
                            value={findingExplanations[i] ?? ""}
                            onChange={(e) => setFindingExplanations((prev) => ({ ...prev, [i]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleConfirmLock}>
                      <Lock className="h-4 w-4" /> Onayla ve Kilitle
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAuditModal(false)}>
                      Veriyi Düzelt
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
