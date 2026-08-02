"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SECTOR_LABELS } from "@/lib/config/cbam-config";

export default function SettingsPage() {
  const { organization, profile } = useAuth();
  if (!organization) return null;

  return (
    <PageContainer title="Ayarlar" description="Organizasyon ve hesap bilgilerin.">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organizasyon</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Firma unvanı</span>
              <span className="text-ink">{organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Sektör</span>
              <span className="text-ink">{SECTOR_LABELS[organization.sector]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Şehir</span>
              <span className="text-ink">{organization.city ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Vergi no</span>
              <span className="text-ink">{organization.taxId ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Abonelik planı</span>
              <Badge tone="steel">{organization.subscriptionPlan}</Badge>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hesabım</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">E-posta</span>
              <span className="text-ink">{profile?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Rol</span>
              <Badge tone={profile?.role === "owner" ? "accent" : "neutral"}>{profile?.role}</Badge>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
}
