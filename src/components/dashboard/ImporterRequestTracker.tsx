"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { AlertTriangle, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  COLLECTIONS,
  type ImporterPackage,
  type ImporterRequest,
  type ImporterRequestStatus,
  type Product,
} from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDateTR } from "@/lib/utils";

const STATUS_LABELS: Record<ImporterRequestStatus, string> = {
  acik: "Açık",
  hazirlaniyor: "Paket hazırlanıyor",
  gonderildi: "Gönderildi",
  onaylandi: "Onaylandı",
};

export function ImporterRequestTracker() {
  const { organization } = useAuth();
  const [requests, setRequests] = useState<ImporterRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<ImporterPackage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [requestedProductIds, setRequestedProductIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!organization?.id) return;
    const unsubReq = onSnapshot(
      query(collection(db, COLLECTIONS.importerRequests), where("organizationId", "==", organization.id)),
      (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImporterRequest, "id">) })))
    );
    const unsubProd = onSnapshot(
      query(collection(db, COLLECTIONS.products), where("organizationId", "==", organization.id)),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })))
    );
    const unsubPkg = onSnapshot(
      query(collection(db, COLLECTIONS.importerPackages), where("organizationId", "==", organization.id)),
      (snap) => setPackages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImporterPackage, "id">) })))
    );
    return () => {
      unsubReq();
      unsubProd();
      unsubPkg();
    };
  }, [organization?.id]);

  function toggleProduct(id: string) {
    setRequestedProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!organization || !dueDate) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, COLLECTIONS.importerRequests), {
        organizationId: organization.id,
        customerName,
        requestedAt: Date.now(),
        dueDate: new Date(dueDate).getTime(),
        requestedProductIds,
        status: "acik",
        note: note || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowForm(false);
      setCustomerName("");
      setDueDate("");
      setRequestedProductIds([]);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(reqId: string, status: ImporterRequestStatus) {
    await updateDoc(doc(db, COLLECTIONS.importerRequests, reqId), { status, updatedAt: serverTimestamp() });
  }

  async function linkPackage(reqId: string, packageId: string) {
    if (!packageId) return;
    await updateDoc(doc(db, COLLECTIONS.importerRequests, reqId), {
      linkedPackageId: packageId,
      status: "gonderildi",
      updatedAt: serverTimestamp(),
    });
  }

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return (
    <Card>
      <CardHeader>
        <CardTitle>İthalatçı Talepleri</CardTitle>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Talep Ekle
        </Button>
      </CardHeader>
      <CardBody>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-5 space-y-3 rounded border border-base-border bg-base-surface2 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Müşteri</Label>
                <Input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label>Termin</Label>
                <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>İstenen ürünler</Label>
              <div className="flex flex-wrap gap-2">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 rounded border border-base-border bg-base-surface px-2 py-1 text-xs text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestedProductIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="accent-accent"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Not (opsiyonel)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Vazgeç
              </Button>
            </div>
          </form>
        )}

        {requests.length === 0 ? (
          <p className="text-sm text-ink-muted py-4 text-center">Henüz kaydedilmiş bir ithalatçı talebi yok.</p>
        ) : (
          <div className="space-y-2">
            {requests
              .sort((a, b) => a.dueDate - b.dueDate)
              .map((req) => {
                const urgent = req.status === "acik" && req.dueDate - now < sevenDays;
                return (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center gap-3 rounded border border-base-border bg-base-surface2 p-3"
                  >
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-sm text-ink font-medium">{req.customerName}</p>
                      <p className="text-xs text-ink-faint">
                        {req.requestedProductIds.length} ürün · Termin: {formatDateTR(req.dueDate)}
                      </p>
                    </div>
                    {urgent && (
                      <Badge tone="danger">
                        <AlertTriangle className="h-3 w-3" /> Termin yaklaşıyor
                      </Badge>
                    )}
                    <Select
                      value={req.status}
                      onChange={(e) => updateStatus(req.id, e.target.value as ImporterRequestStatus)}
                      className="w-auto"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </Select>
                    {!req.linkedPackageId && (
                      <Select
                        defaultValue=""
                        onChange={(e) => linkPackage(req.id, e.target.value)}
                        className="w-auto"
                      >
                        <option value="">Pakete bağla...</option>
                        {packages.map((p) => (
                          <option key={p.id} value={p.id}>{p.buyerName} — {p.periodYear}</option>
                        ))}
                      </Select>
                    )}
                    {req.linkedPackageId && <Badge tone="steel">Pakete bağlı</Badge>}
                  </div>
                );
              })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
