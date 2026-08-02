"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/giris");
      return;
    }
    if (profile && !profile.organizationId) {
      router.push("/onboarding");
    }
  }, [loading, user, profile, router]);

  if (loading || !user || !profile?.organizationId) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-sm text-ink-muted">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
