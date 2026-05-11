"use client";

import { usePathname } from "next/navigation";

// Maps URL paths to human-readable page titles shown in the header
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory",
  "/sales": "Sales",
  "/analytics": "Analytics",
  "/import-export": "Import / Export",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "MarginIQ";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Current page title */}
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>

      {/* User avatar placeholder */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Welcome back</span>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
          U
        </div>
      </div>
    </header>
  );
}
