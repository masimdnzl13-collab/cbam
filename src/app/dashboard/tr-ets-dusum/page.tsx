"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, doc, where } from "firebase/firestore";
import { Info, Plus, Paperclip } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type CarbonPriceRecord, type Installation } from "@/lib/types";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { uploadDocument } from "@/lib/documents";
import { logAudit } from "@/lib/audit";
import { formatNumber } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENCIES = ["TRY", "EUR", "USD"];

export default function CarbonPricePage() {
  const { organization } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [records, setRecords] = useState<CarbonPriceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [installationId, setInstallationId] = useState("");
  const [scheme, setScheme] = useState("TR ETS Pilot Dönemi");
  const [periodYear, setPeriodYear] = useState(CURRENT_YEAR);
  const [periodQuarter, setPeriodQuarter] = useState("yillik");
  const [amountPaid, setAmountPaid] = useState(0);
  const [currency, setCurrency] = useState("TRY");
  const [tonnesCovered, setTonnesCovered] = useState(0);
  const [hasAllocationOrRefund, setHasAllocationOrRefund] = useState(false);
  const [allocationNote, setAllocationNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!organization?.id) return;
    const unsubInst = onSnapshot(
      query(collection(db, COLLECTIONS.installations), where("organizationId", "==", organization.id)),
      (snap) => setInstallations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })))
    );
    const unsubRec = onSnapshot(
      query(collection(db, COLLECTIONS.carbonPrices), where("organizationId", "==", organization.id)),
      (snap) => setRecords(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarbonPriceRecord, "id">) })))
    );
    return () => {
      unsubInst();
      unsubRec();
    };
  }, [organization?.id]);

  const effectivePrice = tonnesCovered > 0 ? amountPaid / tonnesCovered : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!organization) return;
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, COLLECTIONS.carbonPrices), {
        organizationId: organization.id,
        installationId,
        scheme,
        periodYear,
        periodQuarter: periodQuarter === "yillik" ? null : Number(periodQuarter),
        amountPaid,
        currency,
        tonnesCovered,
        effectivePricePerTon: effectivePrice,
        hasAllocationOrRefund,
        allocationNote: allocationNote || null,
        createdAt: serverTimestamp(),
      });

      if (file && auth.currentUser) {
        const documentId = await uploadDocument({
          organizationId: organization.id,
          file,
          relatedCollection: COLLECTIONS.carbonPrices,
          relatedId: ref.id,
          uploadedBy: auth.currentUser.uid,
          installationId,
          periodYear,
          docType: "karbon_odeme_belgesi",
          expectedDocTypeDescription: `Karbon ödeme belgesi (${scheme})`,
          expectedAmount: amountPaid,
          expectedUnit: currency,
        });
        await updateDoc(doc(db, COLLECTIONS.carbonPrices, ref.id), { documentId });
      }

      await logAudit({ action: "create", collection: COLLECTIONS.carbonPrices, documentId: ref.id });
      setShowForm(false);
      setAmountPaid(0);
      setTonnesCovered(0);
      setAllocationNote("");
      setFile(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (!organization) return null;

  return (
    <PageContainer
      title="TR ETS Düşüm Dosyası"
      description="Türkiye'de ödenen karbon bedelini, gün geldiğinde CBAM yükünden düşülebilmesi için belgele."
      actions={
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Yeni Kayıt
        </Button>
      }
    >
      <Card className="mb-6 border-steel/30">
        <CardBody className="flex gap-3">
          <Info className="h-5 w-5 text-steel shrink-0" />
          <p className="text-sm text-ink-muted leading-relaxed">
            Türkiye Emisyon Ticaret Sistemi (TR ETS) şu anda pilot aşamadadır. Üçüncü ülkede ödenen
            karbon bedelinin CBAM yükümlülüğünden nasıl düşüleceğine ilişkin AB uygulama kuralları
            henüz netleşme sürecindedir. Bu modül hukuki bir kesinlik vaat etmez — amacı, düşüm
            mekanizması netleştiğinde <strong className="text-ink">belgen hazır olsun</strong> diye
            bir hazırlık çerçevesi kurmaktır.
          </p>
        </CardBody>
      </Card>

      {showForm && (
        <Card className="mb-6 max-w-2xl">
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tesis</Label>
                  <Select required value={installationId} onChange={(e) => setInstallationId(e.target.value)}>
                    <option value="">Seç...</option>
                    {installations.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Sistem adı</Label>
                  <Input required value={scheme} onChange={(e) => setScheme(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Dönem yılı</Label>
                  <Input type="number" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Alt kırılım</Label>
                  <Select value={periodQuarter} onChange={(e) => setPeriodQuarter(e.target.value)}>
                    <option value="yillik">Yıllık</option>
                    <option value="1">Ç1</option>
                    <option value="2">Ç2</option>
                    <option value="3">Ç3</option>
                    <option value="4">Ç4</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Ödenen tutar</Label>
                  <Input type="number" min={0} step="any" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Para birimi</Label>
                  <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Kapsanan emisyon (tCO₂e)</Label>
                  <Input type="number" min={0} step="any" value={tonnesCovered} onChange={(e) => setTonnesCovered(Number(e.target.value))} />
                </div>
              </div>
              <div className="rounded border border-base-border bg-base-surface2 px-3 py-2 text-sm text-ink-muted">
                Ton başına efektif fiyat:{" "}
                <span className="font-tabular text-ink font-semibold">
                  {formatNumber(effectivePrice, 2)} {currency}/tCO₂e
                </span>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={hasAllocationOrRefund}
                    onChange={(e) => setHasAllocationOrRefund(e.target.checked)}
                    className="accent-accent"
                  />
                  Bu ödeme için tahsisat veya iade var
                </label>
              </div>
              {hasAllocationOrRefund && (
                <div>
                  <Label>Tahsisat / iade notu</Label>
                  <Textarea rows={2} value={allocationNote} onChange={(e) => setAllocationNote(e.target.value)} />
                </div>
              )}
              <div>
                <Label>Ödeme belgesi</Label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-ink-muted file:mr-3 file:rounded file:border-0 file:bg-base-surface2 file:px-3 file:py-1.5 file:text-xs file:text-ink"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || !installationId}>
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Vazgeç
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {records.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10 text-sm text-ink-muted">
            Henüz karbon fiyatı kaydın yok.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Tesis</TH>
                <TH>Sistem</TH>
                <TH>Dönem</TH>
                <TH>Ödenen tutar</TH>
                <TH>Kapsanan emisyon</TH>
                <TH>Efektif fiyat</TH>
                <TH>Tahsisat/İade</TH>
                <TH>Belge</TH>
              </TR>
            </THead>
            <TBody>
              {records.map((r) => (
                <TR key={r.id}>
                  <TD>{installations.find((i) => i.id === r.installationId)?.name ?? "-"}</TD>
                  <TD>{r.scheme}</TD>
                  <TD className="font-tabular">{r.periodYear}{r.periodQuarter ? ` Ç${r.periodQuarter}` : ""}</TD>
                  <TD className="font-tabular">{formatNumber(r.amountPaid, 2)} {r.currency}</TD>
                  <TD className="font-tabular">{formatNumber(r.tonnesCovered, 2)} tCO₂e</TD>
                  <TD className="font-tabular">{formatNumber(r.effectivePricePerTon, 2)} {r.currency}/t</TD>
                  <TD>
                    {r.hasAllocationOrRefund ? <Badge tone="warning">Var</Badge> : <Badge tone="neutral">Yok</Badge>}
                  </TD>
                  <TD>
                    {r.documentId ? (
                      <Badge tone="success"><Paperclip className="h-3 w-3" /> Ekli</Badge>
                    ) : (
                      <Badge tone="neutral">Yok</Badge>
                    )}
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
