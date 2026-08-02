"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import { registerWithEmail, signInWithGoogle } from "@/lib/auth/actions";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerWithEmail(email, password);
      router.push("/onboarding");
    } catch {
      setError("Hesap oluşturulamadı. E-posta zaten kayıtlı olabilir veya şifre çok kısa.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/onboarding");
    } catch {
      setError("Google ile kayıt başarısız oldu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Flame className="h-5 w-5 text-accent" />
          <span className="font-heading text-lg font-semibold tracking-wide">KarbonRota</span>
        </div>
        <Card>
          <CardBody>
            <h1 className="font-heading text-lg font-semibold text-ink mb-5">Hesap oluştur</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">İş e-postan</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Oluşturuluyor..." : "Hesap Oluştur"}
              </Button>
            </form>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-base-border" />
              <span className="text-xs text-ink-faint">veya</span>
              <div className="h-px flex-1 bg-base-border" />
            </div>
            <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={loading}>
              Google ile devam et
            </Button>
            <p className="mt-5 text-center text-xs text-ink-muted">
              Zaten hesabın var mı?{" "}
              <Link href="/giris" className="text-steel hover:underline">
                Giriş yap
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
