"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, Waypoints } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/esteira", label: "Esteira", icon: Waypoints }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-base-border bg-base-surface min-h-screen p-5 flex flex-col gap-8">
      <div className="flex items-center gap-2 px-1">
        <div className="w-7 h-7 rounded-md bg-signal-gold flex items-center justify-center">
          <span className="text-base font-display font-bold text-xs">CX</span>
        </div>
        <span className="font-display font-bold tracking-tight">Creative OS</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-base-raised text-ink font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-base-raised/60"
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-xs text-ink-faint px-1 leading-relaxed">
        Dados financeiros via Utmify.
        <br />
        Hook rate / retenção: em breve.
      </div>
    </aside>
  );
}
