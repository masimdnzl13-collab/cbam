"use client";

import { useEffect, useState } from "react";
import { Flame, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { formatDateTR, formatEuro } from "@/lib/utils";
import type { CalculatorLeadEntry, Organization, WaitlistEntry } from "@/lib/types";

interface AdminOverview {
  organizations: Organization[];
  waitlist: WaitlistEntry[];
  leads: CalculatorLeadEntry[];
  leadsBySector: Record<string, { count: number; totalTon: number }>;
  errors: { id: string; source: string; message: string; createdAt: number }[];
  monthlyRecurringRevenueEur: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${idToken}` } });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Yetkisiz erişim");
        return;
      }
      setData(await res.json());
    })();
  }, [loading, user]);

  if (loading) return null;

  if (!user || error) {
    return (
      <main className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-danger mb-3" />
          <p className="text-sm text-ink-muted">{error ?? "Bu sayfayı görüntülemek için giriş yapmalısın."}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-sm text-ink-muted">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-4">
          <Flame className="h-5 w-5 text-accent" />
          <span className="font-heading text-base font-semibold tracking-wide">KarbonRota Admin</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardBody>
              <p className="text-xs text-ink-muted">Organizasyon</p>
              <p className="font-tabular text-xl text-ink">{data.organizations.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-ink-muted">Bekleme listesi</p>
              <p className="font-tabular text-xl text-ink">{data.waitlist.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-ink-muted">Hesaplayıcı lead</p>
              <p className="font-tabular text-xl text-ink">{data.leads.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-ink-muted">Aylık yinelenen gelir (MRR)</p>
              <p className="font-tabular text-xl text-success">{formatEuro(data.monthlyRecurringRevenueEur)}</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Organizasyonlar</CardTitle></CardHeader>
          <Table>
            <THead>
              <TR><TH>Ad</TH><TH>Sektör</TH><TH>Plan</TH><TH>Durum</TH><TH>Kayıt</TH></TR>
            </THead>
            <TBody>
              {data.organizations.map((o) => (
                <TR key={o.id}>
                  <TD>{o.name}</TD>
                  <TD>{o.sector}</TD>
                  <TD><Badge tone="steel">{o.subscriptionPlan}</Badge></TD>
                  <TD>
                    <Badge tone={o.subscriptionStatus === "active" ? "success" : o.subscriptionStatus === "past_due" ? "danger" : "neutral"}>
                      {o.subscriptionStatus}
                    </Badge>
                  </TD>
                  <TD>{o.createdAt ? formatDateTR(o.createdAt) : "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hesaplayıcı Lead&apos;leri — Sektör Kırılımı</CardTitle></CardHeader>
          <Table>
            <THead>
              <TR><TH>Sektör</TH><TH>Lead sayısı</TH><TH>Toplam tonaj</TH></TR>
            </THead>
            <TBody>
              {Object.entries(data.leadsBySector).map(([sector, stats]) => (
                <TR key={sector}>
                  <TD>{sector}</TD>
                  <TD className="font-tabular">{stats.count}</TD>
                  <TD className="font-tabular">{stats.totalTon.toLocaleString("tr-TR")} t</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader><CardTitle>Son Hatalar</CardTitle></CardHeader>
          <CardBody>
            {data.errors.length === 0 ? (
              <p className="text-sm text-ink-muted">Kayıtlı hata yok.</p>
            ) : (
              <div className="space-y-2">
                {data.errors.map((e) => (
                  <div key={e.id} className="rounded border border-danger/30 bg-danger/5 p-3 text-xs">
                    <p className="text-danger font-medium">{e.source}</p>
                    <p className="text-ink-muted mt-1">{e.message}</p>
                    <p className="text-ink-faint mt-1">{formatDateTR(e.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
