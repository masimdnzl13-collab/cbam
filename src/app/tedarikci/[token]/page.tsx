"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { CheckCircle2, Clock, Flame, HelpCircle, Info } from "lucide-react";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type SupplierRequest } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type Mode = "declare" | "decline";

export default function SupplierPortalPage() {
  const params = useParams<{ token: string }>();
  const [request, setRequest] = useState<SupplierRequest | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<Mode>("declare");
  const [declaredValue, setDeclaredValue] = useState<number>(0);
  const [declaredMethod, setDeclaredMethod] = useState("olcum");
  const [declineReason, setDeclineReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!params.token) return;
    getDoc(doc(db, COLLECTIONS.supplierRequests, params.token)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      const data = { id: snap.id, ...(snap.data() as Omit<SupplierRequest, "id">) };
      setRequest(data);
      if (data.status === "yanitlandi" || data.status === "reddedildi" || data.status === "onaylandi") {
        setSubmitted(true);
      }
      fetch(`/api/supplier-request/${params.token}/view`, { method: "POST" }).catch(() => {});
    });
  }, [params.token]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("mode", mode);
      if (mode === "declare") {
        formData.append("declaredValue", String(declaredValue));
        formData.append("declaredMethod", declaredMethod);
        if (file) formData.append("file", file);
      } else {
        formData.append("declineReason", declineReason);
      }
      await fetch(`/api/supplier-request/${params.token}/respond`, { method: "POST", body: formData });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-sm text-ink-muted">Bu bağlantı geçersiz veya süresi dolmuş.</p>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-sm text-ink-muted">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-4">
          <Flame className="h-5 w-5 text-accent" />
          <span className="font-heading text-base font-semibold tracking-wide">KarbonRota</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        {submitted ? (
          <Card>
            <CardBody className="text-center py-12">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success mb-3" />
              <h1 className="font-heading text-lg font-semibold text-ink">Teşekkürler!</h1>
              <p className="mt-2 text-sm text-ink-muted">
                Bilgin {request.organizationName} tarafına iletildi. Zaman ayırdığın için teşekkür ederiz.
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <Badge tone="steel" className="mb-3">
                <Clock className="h-3 w-3" /> Tahmini 5 dakika
              </Badge>
              <h1 className="font-heading text-xl font-semibold text-ink">
                {request.organizationName}, senden bir bilgi istiyor
              </h1>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                {request.organizationName}, AB&apos;ye ihraç ettiği bir ürün için sattığın{" "}
                <strong className="text-ink">{request.precursorName}</strong> ürününün üretim sırasında ortaya
                çıkardığı karbon emisyonu (gömülü emisyon) bilgisine ihtiyaç duyuyor. Bu, AB&apos;nin Sınırda
                Karbon Düzenleme Mekanizması (CBAM) gereği isteniyor.
              </p>
            </div>

            <Card className="mb-4 border-steel/30">
              <CardBody className="flex gap-2 text-xs text-ink-muted">
                <Info className="h-4 w-4 text-steel shrink-0" />
                <p>
                  <strong className="text-ink">Gömülü emisyon nedir?</strong> Bu ürünün 1 tonunu üretmek için
                  ne kadar CO₂ eşdeğeri sera gazı ortaya çıktığının tahmini (tCO₂e/ton). Örnek: 1.85 tCO₂e/ton.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("declare")}
                    className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                      mode === "declare" ? "border-accent bg-accent/10 text-accent" : "border-base-border text-ink-muted"
                    }`}
                  >
                    Değer Beyan Edeceğim
                  </button>
                  <button
                    onClick={() => setMode("decline")}
                    className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                      mode === "decline" ? "border-warning bg-warning/10 text-warning" : "border-base-border text-ink-muted"
                    }`}
                  >
                    Bu Veriyi Veremiyorum
                  </button>
                </div>

                {mode === "declare" ? (
                  <>
                    <div>
                      <Label>Gömülü emisyon değeri (tCO₂e / ton)</Label>
                      <Input
                        type="number"
                        step="any"
                        min={0}
                        placeholder="ör. 1.85"
                        value={declaredValue}
                        onChange={(e) => setDeclaredValue(Number(e.target.value))}
                      />
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                        <HelpCircle className="h-3 w-3" /> Örnek doldurulmuş görünüm: 1.85
                      </p>
                    </div>
                    <div>
                      <Label>Bu değeri nasıl hesapladın?</Label>
                      <Select value={declaredMethod} onChange={(e) => setDeclaredMethod(e.target.value)}>
                        <option value="olcum">Doğrudan ölçüm</option>
                        <option value="hesaplama">Kendi hesaplamam</option>
                        <option value="lca">Yaşam döngüsü analizi (LCA)</option>
                        <option value="diger">Diğer</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Destekleyici belge (opsiyonel)</Label>
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-ink-muted file:mr-3 file:rounded file:border-0 file:bg-base-surface2 file:px-3 file:py-1.5 file:text-xs file:text-ink"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label>Neden paylaşamıyorsun? (opsiyonel ama yardımcı olur)</Label>
                    <Textarea rows={3} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
                  </div>
                )}

                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
