"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { Archive, ExternalLink, ShieldCheck } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  COLLECTIONS,
  type ActivityData,
  type AuditLogEntry,
  type DocumentCheck,
  type DocumentRecord,
  type PeriodExplanation,
  type EmissionCalculation,
  type Installation,
  type ProductionProcess,
} from "@/lib/types";
import { ReliabilityBadge } from "@/components/ai/ReliabilityBadge";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { formatDateTR } from "@/lib/utils";
import { generateVerifierPackagePdf } from "@/lib/verifier/pdf";
import { fetchLatestCalculationForProcess } from "@/lib/calculations/queries";

const RELATED_SECTION_HREF: Record<string, string> = {
  activity_data: "/dashboard/faaliyet-verisi",
  precursors: "/dashboard/urunler",
  carbon_prices: "/dashboard/tr-ets-dusum",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  yakit_belgesi: "Yakıt belgesi (fatura/sayaç)",
  girdi_malzemesi_belgesi: "Girdi malzemesi belgesi",
  ppa_sozlesmesi: "PPA sözleşmesi",
  tedarikci_beyani: "Tedarikçi beyanı",
  karbon_odeme_belgesi: "Karbon ödeme belgesi",
};

export default function DocumentVaultPage() {
  const { organization } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [installationFilter, setInstallationFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [documentChecks, setDocumentChecks] = useState<Record<string, DocumentCheck>>({});
  const [verifierInstallationId, setVerifierInstallationId] = useState("");
  const [verifierYear, setVerifierYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    const unsubDocs = onSnapshot(
      query(collection(db, COLLECTIONS.documents), where("organizationId", "==", organization.id)),
      (snap) => setDocuments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentRecord, "id">) })))
    );
    const unsubInst = onSnapshot(
      query(collection(db, COLLECTIONS.installations), where("organizationId", "==", organization.id)),
      (snap) => setInstallations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })))
    );
    const unsubProc = onSnapshot(
      query(collection(db, COLLECTIONS.productionProcesses), where("organizationId", "==", organization.id)),
      (snap) => setProcesses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })))
    );
    const unsubAudit = onSnapshot(
      query(collection(db, COLLECTIONS.auditLog), where("organizationId", "==", organization.id)),
      (snap) => setAuditEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLogEntry, "id">) })))
    );
    const unsubChecks = onSnapshot(
      query(collection(db, COLLECTIONS.documentChecks), where("organizationId", "==", organization.id)),
      (snap) => {
        const map: Record<string, DocumentCheck> = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...(d.data() as Omit<DocumentCheck, "id">) };
        });
        setDocumentChecks(map);
      }
    );
    return () => {
      unsubDocs();
      unsubInst();
      unsubProc();
      unsubAudit();
      unsubChecks();
    };
  }, [organization?.id]);

  async function handleGenerateVerifierPackage() {
    if (!organization || !verifierInstallationId) return;
    setGenerating(true);
    try {
      const installation = installations.find((i) => i.id === verifierInstallationId);
      if (!installation) return;
      const installationProcesses = processes.filter((p) => p.installationId === verifierInstallationId);

      const activityDataByProcess: Record<string, ActivityData | undefined> = {};
      const calculationByProcess: Record<string, EmissionCalculation | undefined> = {};
      for (const proc of installationProcesses) {
        const adSnap = await getDocs(
          query(
            collection(db, COLLECTIONS.activityData),
            where("organizationId", "==", organization.id),
            where("processId", "==", proc.id),
            where("periodYear", "==", verifierYear)
          )
        );
        const adDocs = adSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityData, "id">) }))
          .sort((a, b) => b.version - a.version);
        activityDataByProcess[proc.id] = adDocs[0];
        calculationByProcess[proc.id] =
          (await fetchLatestCalculationForProcess(organization.id, proc.id, verifierYear)) ?? undefined;
      }

      const relevantDocIds = new Set([
        ...Object.values(activityDataByProcess).map((a) => a?.id),
        ...Object.values(calculationByProcess).map((c) => c?.id),
      ]);
      const relevantDocuments = documents.filter(
        (d) => d.installationId === verifierInstallationId && (!d.periodYear || d.periodYear === verifierYear)
      );
      const relevantAudit = auditEntries.filter((e) => relevantDocIds.has(e.documentId));

      const explanationByProcess: Record<string, PeriodExplanation | undefined> = {};
      for (const proc of installationProcesses) {
        const calcId = calculationByProcess[proc.id]?.id;
        if (!calcId) continue;
        const expSnap = await getDocs(
          query(collection(db, COLLECTIONS.periodExplanations), where("calculationId", "==", calcId), where("approved", "==", true))
        );
        if (!expSnap.empty) {
          const d = expSnap.docs[0];
          explanationByProcess[proc.id] = { id: d.id, ...(d.data() as Omit<PeriodExplanation, "id">) };
        }
      }

      const pdf = generateVerifierPackagePdf({
        installation,
        periodYear: verifierYear,
        processes: installationProcesses,
        activityDataByProcess,
        calculationByProcess,
        explanationByProcess,
        documents: relevantDocuments,
        auditEntries: relevantAudit,
      });
      pdf.save(`dogrulayici-paketi-${installation.name}-${verifierYear}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  const periods = useMemo(
    () => Array.from(new Set(documents.map((d) => d.periodYear).filter((y): y is number => !!y))).sort((a, b) => b - a),
    [documents]
  );

  const filtered = documents.filter((d) => {
    if (installationFilter && d.installationId !== installationFilter) return false;
    if (periodFilter && String(d.periodYear) !== periodFilter) return false;
    if (typeFilter && d.docType !== typeFilter) return false;
    return true;
  });

  if (!organization) return null;

  return (
    <PageContainer title="Belge Kasası" description="Sisteme yüklenen tüm destekleyici belgeler tek yerde.">
      <Card className="mb-6 border-steel/30">
        <CardHeader>
          <CardTitle>Doğrulayıcı Hazırlık Paketi</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-ink-muted mb-4 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-steel shrink-0 mt-0.5" />
            Bir tesis ve dönem seç; doğrulayıcının isteyeceği faaliyet verileri, hesaplama adımları,
            ekli belgeler ve denetim izini tek bir numaralandırılmış PDF&apos;te topla.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Tesis</Label>
              <Select value={verifierInstallationId} onChange={(e) => setVerifierInstallationId(e.target.value)}>
                <option value="">Seç...</option>
                {installations.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Dönem yılı</Label>
              <Select value={verifierYear} onChange={(e) => setVerifierYear(Number(e.target.value))}>
                {[verifierYear - 1, verifierYear, verifierYear + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateVerifierPackage} disabled={!verifierInstallationId || generating} className="w-full">
                {generating ? "Oluşturuluyor..." : "Paketi İndir"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Tesis</Label>
            <Select value={installationFilter} onChange={(e) => setInstallationFilter(e.target.value)}>
              <option value="">Tümü</option>
              {installations.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Dönem</Label>
            <Select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
              <option value="">Tümü</option>
              {periods.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Belge tipi</Label>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Tümü</option>
              {Object.entries(DOC_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            <Archive className="mx-auto h-6 w-6 text-ink-faint mb-2" />
            Filtrelere uyan belge bulunamadı.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Dosya</TH>
                <TH>Tip</TH>
                <TH>Tesis</TH>
                <TH>Dönem</TH>
                <TH>Yüklenme</TH>
                <TH>Güvenilirlik</TH>
                <TH>Kaynağa git</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((d) => (
                <TR key={d.id}>
                  <TD>{d.fileName}</TD>
                  <TD><Badge tone="steel">{DOC_TYPE_LABELS[d.docType ?? ""] ?? d.docType ?? d.relatedCollection}</Badge></TD>
                  <TD>{installations.find((i) => i.id === d.installationId)?.name ?? "-"}</TD>
                  <TD className="font-tabular">{d.periodYear ?? "-"}</TD>
                  <TD>{d.createdAt ? formatDateTR(d.createdAt) : "-"}</TD>
                  <TD><ReliabilityBadge check={documentChecks[d.id]} /></TD>
                  <TD>
                    <a
                      href={RELATED_SECTION_HREF[d.relatedCollection] ?? "#"}
                      className="inline-flex items-center gap-1 text-steel hover:underline text-xs"
                    >
                      Git <ExternalLink className="h-3 w-3" />
                    </a>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </PageContainer>
  );
}
