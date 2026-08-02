"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Flame, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { COLLECTIONS, type Sector, type CbamGoodsCategory } from "@/lib/types";
import { SECTOR_LABELS, SECTOR_REPORTED_SCOPE } from "@/lib/config/cbam-config";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const SECTORS: Sector[] = ["demir_celik", "aluminyum", "cimento", "gubre", "hidrojen"];

const CATEGORY_OPTIONS: { value: CbamGoodsCategory; label: string }[] = [
  { value: "demir_celik", label: "Demir-Çelik ürünleri" },
  { value: "aluminyum", label: "Alüminyum ürünleri" },
  { value: "cimento", label: "Çimento" },
  { value: "gubre", label: "Gübre" },
  { value: "hidrojen", label: "Hidrojen" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // step 1
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("");
  const [taxId, setTaxId] = useState("");

  // step 2
  const [sector, setSector] = useState<Sector>("demir_celik");
  const [categories, setCategories] = useState<CbamGoodsCategory[]>(["demir_celik"]);

  // step 3
  const [installationCount, setInstallationCount] = useState(1);
  const [installationName, setInstallationName] = useState("");
  const [installationCity, setInstallationCity] = useState("");

  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/giris");
    if (!loading && profile?.organizationId) router.push("/dashboard");
  }, [loading, user, profile, router]);

  function toggleCategory(cat: CbamGoodsCategory) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  async function handleStep3Submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const orgRef = await addDoc(collection(db, COLLECTIONS.organizations), {
        name: orgName,
        sector,
        city,
        taxId: taxId || null,
        contactEmail: user.email ?? "",
        exportedCategories: categories,
        subscriptionPlan: "deneme",
        subscriptionStatus: "trialing",
        trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
        onboardingCompleted: true,
        onboardingChecklist: {
          installationDetailsCompleted: false,
          firstActivityDataEntered: false,
          productsMapped: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, COLLECTIONS.installations), {
        organizationId: orgRef.id,
        name: installationName,
        city: installationCity,
        country: "Türkiye",
        productionRouteType: "diger",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
        organizationId: orgRef.id,
        role: "owner",
      });

      setCreatedOrgId(orgRef.id);
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  }

  const reportedScope = SECTOR_REPORTED_SCOPE[sector];

  return (
    <main className="min-h-screen bg-base flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Flame className="h-5 w-5 text-accent" />
          <span className="font-heading text-lg font-semibold tracking-wide">KarbonRota</span>
        </div>

        <div className="mb-6 flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded ${s <= step ? "bg-accent" : "bg-base-surface2"}`} />
          ))}
        </div>

        <Card>
          <CardBody>
            {step === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="space-y-4"
              >
                <h2 className="font-heading text-lg font-semibold text-ink">Firma bilgileri</h2>
                <div>
                  <Label htmlFor="orgName">Firma unvanı</Label>
                  <Input id="orgName" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="taxId">Vergi numarası (opsiyonel)</Label>
                  <Input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">
                  Devam Et <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(3);
                }}
                className="space-y-4"
              >
                <h2 className="font-heading text-lg font-semibold text-ink">Sektör ve ürün grupları</h2>
                <div>
                  <Label>Ana sektörün</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSector(s)}
                        className={`rounded border px-3 py-2.5 text-sm font-medium transition-colors ${
                          sector === s
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-base-border bg-base-surface2 text-ink-muted hover:text-ink"
                        }`}
                      >
                        {SECTOR_LABELS[s] ?? s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>AB&apos;ye ihraç ettiğin ürün grupları</Label>
                  <div className="space-y-2">
                    {CATEGORY_OPTIONS.map((c) => (
                      <label
                        key={c.value}
                        className="flex items-center gap-2 rounded border border-base-border bg-base-surface2 px-3 py-2 text-sm text-ink cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={categories.includes(c.value)}
                          onChange={() => toggleCategory(c.value)}
                          className="accent-accent"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Devam Et <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-4">
                <h2 className="font-heading text-lg font-semibold text-ink">Tesisin</h2>
                <div>
                  <Label htmlFor="installationCount">Kaç üretim tesisin var?</Label>
                  <Input
                    id="installationCount"
                    type="number"
                    min={1}
                    value={installationCount}
                    onChange={(e) => setInstallationCount(Number(e.target.value))}
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  İlk tesisini hızlıca kaydedelim, detaylarını (proses, koordinat vb.) daha sonra
                  Tesisler bölümünden tamamlayabilirsin.
                </p>
                <div>
                  <Label htmlFor="installationName">Tesis adı</Label>
                  <Input
                    id="installationName"
                    required
                    value={installationName}
                    onChange={(e) => setInstallationName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="installationCity">Şehir</Label>
                  <Input
                    id="installationCity"
                    required
                    value={installationCity}
                    onChange={(e) => setInstallationCity(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Kaydediliyor..." : "Devam Et"} <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {step === 4 && createdOrgId && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-semibold text-ink">Yükümlülük özetin hazır</h2>
                <div className="rounded border border-base-border bg-base-surface2 p-4">
                  <p className="text-sm text-ink-muted">
                    <span className="text-ink font-medium">{SECTOR_LABELS[sector]}</span> sektöründe
                    ithalatçıya raporlanan kapsam:
                  </p>
                  <Badge tone={reportedScope === "direct_only" ? "steel" : "warning"} className="mt-2">
                    {reportedScope === "direct_only" ? "Yalnızca doğrudan emisyonlar" : "Doğrudan + dolaylı emisyonlar"}
                  </Badge>
                  <p className="mt-3 text-xs text-ink-faint">
                    Kesin dönem 1 Ocak 2026&apos;da başladı. Mali yük (sertifika satışları) 1 Şubat
                    2027&apos;de, ilk yıllık beyan 30 Eylül 2027&apos;de.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink mb-2">Başlangıç kontrol listen</p>
                  <div className="space-y-2">
                    {[
                      "Tesis detaylarını tamamla (proses, koordinat, üretim rotası)",
                      "İlk dönem faaliyet verini gir",
                      "Ürünlerini CN koduyla eşle",
                    ].map((task) => (
                      <div key={task} className="flex items-center gap-2 text-sm text-ink-muted">
                        <Circle className="h-4 w-4 text-ink-faint shrink-0" />
                        {task}
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={() => router.push("/dashboard")}>
                  <CheckCircle2 className="h-4 w-4" /> Panele Git
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
