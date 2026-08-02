"use client";

import { useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Flame, ArrowRight, PartyPopper } from "lucide-react";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type Sector, type CbamGoodsCategory } from "@/lib/types";
import { SECTOR_LABELS } from "@/lib/config/cbam-config";
import { lookupCnCode } from "@/lib/config/cn-code-mapping";
import { estimateExposure, projectMultiYearCost } from "@/lib/calculations/exposure-estimate";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { ResultScreen } from "@/components/calculator/ResultScreen";

type Step = 1 | 2 | 3;

const SECTORS: Sector[] = ["demir_celik", "aluminyum", "cimento", "gubre"];

export default function CalculatorPage() {
  const [step, setStep] = useState<Step>(1);
  const [sector, setSector] = useState<Sector>("demir_celik");
  const [cnCode, setCnCode] = useState("");
  const [outOfScope, setOutOfScope] = useState(false);
  const [category, setCategory] = useState<CbamGoodsCategory>("demir_celik");

  const [annualExportTon, setAnnualExportTon] = useState<number>(5000);
  const [euCustomerCount, setEuCustomerCount] = useState<number>(3);

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);

  function handleStep1(e: FormEvent) {
    e.preventDefault();
    const lookup = lookupCnCode(cnCode);
    if (!lookup.matched || !lookup.entry) {
      setOutOfScope(true);
      return;
    }
    setOutOfScope(false);
    setCategory(lookup.entry.category);
    setSector(lookup.entry.sector);
    setStep(2);
  }

  function handleStep2(e: FormEvent) {
    e.preventDefault();
    setStep(3);
  }

  async function handleStep3(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS.calculatorLeads), {
        email,
        sector,
        cnCodePrefix: cnCode,
        annualExportTon,
        euCustomerCount,
        inScope: true,
        createdAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
      setShowResult(true);
    }
  }

  const result = useMemo(
    () => estimateExposure({ sector, category, annualExportTon, targetYear: 2027 }),
    [sector, category, annualExportTon]
  );
  const projection = useMemo(
    () => projectMultiYearCost(sector, category, annualExportTon),
    [sector, category, annualExportTon]
  );

  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-base-border print:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <Flame className="h-5 w-5 text-accent" />
          <Link href="/" className="font-heading text-base font-semibold tracking-wide">
            KarbonRota
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {!showResult && (
          <div className="mb-8 print:hidden">
            <h1 className="font-heading text-2xl font-semibold text-ink">
              Ücretsiz SKDM Maruziyet Hesaplayıcı
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Kayıt gerekmez, 30 saniyede tahmini maruziyetini gör.
            </p>
            <div className="mt-4 flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded ${s <= step ? "bg-accent" : "bg-base-surface2"}`}
                />
              ))}
            </div>
          </div>
        )}

        {showResult ? (
          <ResultScreen
            result={result}
            projection={projection}
            annualExportTon={annualExportTon}
            onRestart={() => {
              setShowResult(false);
              setStep(1);
              setCnCode("");
              setOutOfScope(false);
            }}
          />
        ) : outOfScope ? (
          <Card>
            <CardBody className="text-center py-10">
              <PartyPopper className="mx-auto h-8 w-8 text-success mb-3" />
              <h2 className="font-heading text-lg font-semibold text-ink">
                İyi haber: bu ürün şu an CBAM kapsamında görünmüyor
              </h2>
              <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
                Girdiğin GTİP kodu mevcut CBAM emtia listesinde eşleşmedi. Ancak kapsam genişlemesi
                AB nezdinde tartışılıyor — gelişmelerden haberdar olmak için e-posta bırakabilirsin.
              </p>
              <div className="mt-5 flex justify-center">
                <WaitlistForm compact />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setOutOfScope(false);
                  setCnCode("");
                }}
              >
                Başka bir kod dene
              </Button>
            </CardBody>
          </Card>
        ) : step === 1 ? (
          <Card>
            <CardBody>
              <form onSubmit={handleStep1} className="space-y-5">
                <div>
                  <Label>Sektörün</Label>
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
                        {SECTOR_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="cn">Ürün grubunun GTİP kodu (ilk 4 hane)</Label>
                  <Input
                    id="cn"
                    required
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="ör. 7208"
                    value={cnCode}
                    onChange={(e) => setCnCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={cnCode.length < 4}>
                  Devam Et <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardBody>
          </Card>
        ) : step === 2 ? (
          <Card>
            <CardBody>
              <form onSubmit={handleStep2} className="space-y-5">
                <div>
                  <Label htmlFor="tonnage">Yıllık AB ihracat tonajı (ton)</Label>
                  <Input
                    id="tonnage"
                    type="number"
                    required
                    min={1}
                    value={annualExportTon}
                    onChange={(e) => setAnnualExportTon(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="customers">Kaç farklı AB müşterisine ihracat yapıyorsun?</Label>
                  <Input
                    id="customers"
                    type="number"
                    required
                    min={1}
                    value={euCustomerCount}
                    onChange={(e) => setEuCustomerCount(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Devam Et <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <form onSubmit={handleStep3} className="space-y-5">
                <div>
                  <Label htmlFor="email">Sonucu görmek için e-posta adresin</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="is.epostan@sirket.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Hesaplanıyor..." : "Sonucumu Göster"}
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </main>
  );
}
