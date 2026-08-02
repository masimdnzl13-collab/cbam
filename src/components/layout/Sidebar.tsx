"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Package,
  ClipboardList,
  Calculator,
  TrendingUp,
  Settings,
  Flame,
  Coins,
  Send,
  Archive,
  History,
  CreditCard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/dashboard/tesisler", label: "Tesisler", icon: Factory },
  { href: "/dashboard/urunler", label: "Ürünler", icon: Package },
  { href: "/dashboard/faaliyet-verisi", label: "Faaliyet Verisi", icon: ClipboardList },
  { href: "/dashboard/hesaplamalar", label: "Hesaplamalar", icon: Calculator },
  { href: "/dashboard/maliyet-simulasyonu", label: "Maliyet Simülasyonu", icon: TrendingUp },
  { href: "/dashboard/tr-ets-dusum", label: "TR ETS Düşüm Dosyası", icon: Coins },
  { href: "/dashboard/paketler", label: "İthalatçı Paketleri", icon: Send },
  { href: "/dashboard/tedarikciler", label: "Tedarikçi Takibi", icon: Users },
  { href: "/dashboard/belgeler", label: "Belge Kasası", icon: Archive },
  { href: "/dashboard/denetim-izi", label: "Denetim İzi", icon: History },
  { href: "/dashboard/faturalama", label: "Faturalama", icon: CreditCard },
  { href: "/dashboard/ayarlar", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-base-border bg-base-surface print:hidden">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-base-border">
        <Flame className="h-5 w-5 text-accent" />
        <span className="font-heading text-sm font-semibold tracking-wide text-ink">
          KarbonRota
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent border-l-2 border-accent -ml-px pl-[11px]"
                  : "text-ink-muted hover:bg-base-surface2 hover:text-ink border-l-2 border-transparent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-base-border px-4 py-3 text-[11px] text-ink-faint">
        KarbonRota &middot; Vian
      </div>
    </aside>
  );
}
