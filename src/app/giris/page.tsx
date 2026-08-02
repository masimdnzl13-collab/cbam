"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth/actions";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function LoginPage() {
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
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch {
      setError("E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      setError("Google ile giriş başarısız oldu.");
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
            <h1 className="font-heading text-lg font-semibold text-ink mb-5">Giriş yap</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Giriş yapılıyor..." : "Giriş yap"}
              </Button>
            </form>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-base-border" />
              <span className="text-xs text-ink-faint">veya</span>
              <div className="h-px flex-1 bg-base-border" />
            </div>
            <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={loading}>
              Google ile giriş yap
            </Button>
            <p className="mt-5 text-center text-xs text-ink-muted">
              Hesabın yok mu?{" "}
              <Link href="/kayit" className="text-steel hover:underline">
                Hesap oluştur
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
