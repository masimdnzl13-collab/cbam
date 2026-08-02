"use client";

import { useState } from "react";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { user, organization } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/giris");
  }

  return (
    <header className="h-14 shrink-0 border-b border-base-border bg-base-surface flex items-center justify-between px-6 print:hidden">
      <div className="text-sm text-ink-muted">
        {organization?.name ?? "Organizasyon yükleniyor..."}
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-base-surface2"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-steel/20 text-steel">
            <UserIcon className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">{user?.email}</span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
        </button>
        {open && (
          <div className="absolute right-0 mt-1 w-48 rounded border border-base-border bg-base-surface2 shadow-panel py-1 z-20">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-base-surface hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
              Çıkış yap
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
