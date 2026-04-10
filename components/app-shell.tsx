import Link from "next/link";
import { PropsWithChildren } from "react";

import { getReadOnlyDemoMessage, isReadOnlyDemoMode } from "@/lib/runtime";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/entry", label: "Monthly Entry" },
  { href: "/goals", label: "Goals" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/settings", label: "Settings" }
];

export function AppShell({ children }: PropsWithChildren) {
  const isReadOnlyDemo = isReadOnlyDemoMode();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-leaf">
                Sustainability Tracker
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-ink">
                Local sustainability reporting for small businesses
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Track operational inputs, convert them into emissions with local
                factors, and spot the biggest opportunities to improve.
              </p>
            </div>
            <div className="rounded-2xl bg-sand px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-ink">
                {isReadOnlyDemo ? "Public demo deployment" : "Local-first MVP"}
              </p>
              <p>
                {isReadOnlyDemo
                  ? "Seeded data, read-only mode, and no external services."
                  : "SQLite storage, editable factors, CSV import/export, demo seed data."}
              </p>
            </div>
          </div>
          {isReadOnlyDemo ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {getReadOnlyDemoMessage()}
            </div>
          ) : null}
          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  "border border-moss/10 bg-mist text-moss hover:border-moss/30 hover:bg-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
