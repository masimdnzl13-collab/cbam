"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { Bell, CheckCircle2, Circle, FileWarning } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type Precursor, type SupplierRequest } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTR, toDate } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

const STATUS_LABELS: Record<string, string> = {
  gonderildi: "Gönderildi",
  goruntulendi: "Görüntülendi",
  yanitlandi: "Yanıtlandı",
  reddedildi: "Veremiyor",
  onaylandi: "Onaylandı",
};

const STATUS_TONES: Record<string, "neutral" | "steel" | "success" | "warning" | "danger"> = {
  gonderildi: "neutral",
  goruntulendi: "steel",
  yanitlandi: "warning",
  reddedildi: "danger",
  onaylandi: "success",
};

export default function SupplierTrackingPage() {
  const { organization } = useAuth();
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [precursors, setPrecursors] = useState<Precursor[]>([]);
  const [reminderSentIds, setReminderSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!organization?.id) return;
    const unsubReq = onSnapshot(
      query(collection(db, COLLECTIONS.supplierRequests), where("organizationId", "==", organization.id)),
      (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupplierRequest, "id">) })))
    );
    const unsubPrec = onSnapshot(
      query(collection(db, COLLECTIONS.precursors), where("organizationId", "==", organization.id)),
      (snap) => setPrecursors(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Precursor, "id">) })))
    );
    return () => {
      unsubReq();
      unsubPrec();
    };
  }, [organization?.id]);

  async function handleApprove(req: SupplierRequest) {
    if (req.declaredValue == null) return;
    await updateDoc(doc(db, COLLECTIONS.precursors, req.precursorId), {
      sourceType: "supplier_with_data",
      supplierEmissionValue: req.declaredValue,
      supplierName: req.supplierName,
      supplierDocumentId: req.documentId ?? null,
      defaultValueUsed: false,
    });
    await updateDoc(doc(db, COLLECTIONS.supplierRequests, req.id), { status: "onaylandi" });
    await logAudit({
      action: "update",
      collection: COLLECTIONS.precursors,
      documentId: req.precursorId,
      changeSummary: `Tedarikçi beyanı onaylandı (${req.supplierName})`,
    });
  }

  async function handleRemind(req: SupplierRequest) {
    const daysAgo = Math.round((Date.now() - toDate(req.sentAt).getTime()) / (1000 * 60 * 60 * 24));
    await fetch("/api/supplier-request/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName: req.organizationName,
        supplierName: req.supplierName,
        supplierEmail: req.supplierEmail,
        precursorName: req.precursorName,
        token: req.token,
        daysAgo,
      }),
    });
    setReminderSentIds((prev) => new Set(prev).add(req.id));
  }

  function missingItems(req: SupplierRequest): string[] {
    const items: string[] = [];
    if (req.status === "yanitlandi") {
      if (req.declaredValue != null && !req.documentId) items.push("Değer var, destekleyici belge yok");
    }
    if (req.status === "gonderildi" || req.status === "goruntulendi") {
      items.push("Henüz yanıt bekleniyor");
    }
    return items;
  }

  if (!organization) return null;

  return (
    <PageContainer
      title="Tedarikçi Takibi"
      description="Tedarikçinizi kovalamayı biz üstlenelim — hangi talep nerede, tek bakışta."
    >
      {requests.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            Henüz tedarikçiye gönderilmiş bir veri talebi yok. Ürünler bölümünde bir öncü ürün üzerinden
            &quot;Tedarikçiden veri iste&quot; ile başlayabilirsin.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests
            .sort((a, b) => toDate(b.sentAt).getTime() - toDate(a.sentAt).getTime())
            .map((req) => {
              const missing = missingItems(req);
              const precursor = precursors.find((p) => p.id === req.precursorId);
              return (
                <Card key={req.id}>
                  <CardBody>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-sm font-semibold text-ink">{req.supplierName || req.supplierEmail}</h3>
                          <Badge tone={STATUS_TONES[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink-muted">
                          {req.precursorName} — {req.supplierEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(req.status === "gonderildi" || req.status === "goruntulendi") && (
                          <Button size="sm" variant="secondary" onClick={() => handleRemind(req)} disabled={reminderSentIds.has(req.id)}>
                            <Bell className="h-3.5 w-3.5" /> {reminderSentIds.has(req.id) ? "Hatırlatıldı" : "Hatırlat"}
                          </Button>
                        )}
                        {req.status === "yanitlandi" && (
                          <Button size="sm" onClick={() => handleApprove(req)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Onayla ve Bağla
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* zaman çizelgesi */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-ink-faint">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Gönderildi {formatDateTR(req.sentAt)}
                      </span>
                      <span className="h-px flex-1 bg-base-border" />
                      <span className="flex items-center gap-1">
                        {req.viewedAt ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-ink-faint" />
                        )}
                        Görüntülendi {req.viewedAt ? formatDateTR(req.viewedAt) : ""}
                      </span>
                      <span className="h-px flex-1 bg-base-border" />
                      <span className="flex items-center gap-1">
                        {req.respondedAt ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-ink-faint" />
                        )}
                        Yanıtlandı {req.respondedAt ? formatDateTR(req.respondedAt) : ""}
                      </span>
                    </div>

                    {req.status === "yanitlandi" && req.declaredValue != null && (
                      <p className="mt-3 font-tabular text-sm text-ink">
                        Beyan edilen değer: <span className="font-semibold text-accent">{req.declaredValue} tCO₂e/ton</span>{" "}
                        ({req.declaredMethod})
                      </p>
                    )}
                    {req.status === "reddedildi" && (
                      <p className="mt-3 text-sm text-ink-muted">Gerekçe: {req.declineReason || "belirtilmedi"}</p>
                    )}
                    {precursor?.defaultValueUsed === false && req.status === "onaylandi" && (
                      <Badge tone="success" className="mt-3">Öncü ürüne bağlandı</Badge>
                    )}

                    {missing.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {missing.map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-warning">
                            <FileWarning className="h-3 w-3" /> {m}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
        </div>
      )}
    </PageContainer>
  );
}
