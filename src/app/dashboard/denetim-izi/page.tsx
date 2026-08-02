"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, History } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type AuditLogEntry } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDateTR, toDate } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  create: "oluşturdu",
  update: "güncelledi",
  lock: "kilitledi",
  new_version: "yeni sürüm açtı",
  calculate: "hesapladı",
};

const COLLECTION_LABELS: Record<string, string> = {
  installations: "Tesis",
  production_processes: "Proses",
  products: "Ürün",
  precursors: "Öncü ürün",
  activity_data: "Faaliyet verisi",
  emission_calculations: "Emisyon hesaplaması",
  carbon_prices: "Karbon fiyatı",
  importer_packages: "İthalatçı paketi",
};

export default function AuditTrailPage() {
  const { organization } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!organization?.id) return;
    const unsub = onSnapshot(
      query(collection(db, COLLECTIONS.auditLog), where("organizationId", "==", organization.id)),
      (snap) => setEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLogEntry, "id">) })))
    );
    return () => unsub();
  }, [organization?.id]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        const t = toDate(e.createdAt).getTime();
        if (startDate && t < new Date(startDate).getTime()) return false;
        if (endDate && t > new Date(endDate).getTime() + 24 * 60 * 60 * 1000) return false;
        return true;
      })
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }, [entries, startDate, endDate]);

  function handleExportPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Denetim İzi Raporu", 40, 40);
    doc.setFontSize(9);
    doc.text(`${organization?.name ?? ""} — ${new Date().toISOString().slice(0, 10)}`, 40, 58);
    autoTable(doc, {
      startY: 75,
      margin: { left: 40, right: 40 },
      styles: { fontSize: 8 },
      head: [["Tarih", "Kullanıcı", "Aksiyon", "Kayıt Türü", "Not"]],
      body: filtered.map((e) => [
        formatDateTR(e.createdAt),
        e.userEmail,
        ACTION_LABELS[e.action] ?? e.action,
        COLLECTION_LABELS[e.collection] ?? e.collection,
        e.changeSummary ?? "-",
      ]),
    });
    doc.save("denetim-izi.pdf");
  }

  if (!organization) return null;

  return (
    <PageContainer
      title="Denetim İzi"
      description="Kim, ne zaman, hangi veriyi neden değiştirdi."
      actions={
        <Button variant="secondary" onClick={handleExportPdf}>
          <Download className="h-4 w-4" /> PDF olarak dışa aktar
        </Button>
      }
    >
      <Card className="mb-6">
        <CardBody className="grid gap-4 sm:grid-cols-2 max-w-md">
          <div>
            <Label>Başlangıç</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Bitiş</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            <History className="mx-auto h-6 w-6 text-ink-faint mb-2" />
            Bu aralıkta bir kayıt yok.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <Card key={e.id}>
              <CardBody className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-medium">{e.userEmail}</span>{" "}
                    <Badge tone="neutral" className="mx-1">{ACTION_LABELS[e.action] ?? e.action}</Badge>
                    <span className="text-ink-muted">{COLLECTION_LABELS[e.collection] ?? e.collection}</span>
                  </p>
                  {e.changeSummary && <p className="mt-1 text-xs text-ink-faint">Not: {e.changeSummary}</p>}
                </div>
                <span className="font-tabular text-xs text-ink-faint shrink-0">{formatDateTR(e.createdAt)}</span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
