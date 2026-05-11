"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Each nav item has a label and the URL it points to
const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventory", href: "/inventory" },
  { label: "Sales", href: "/sales" },
  { label: "Analytics", href: "/analytics" },
  { label: "Import / Export", href: "/import-export" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  // usePathname() tells us which page the user is currently on
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0">
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <span className="text-xl font-bold tracking-tight">MarginIQ</span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">MarginIQ v0.1.0</p>
      </div>
    </aside>
  );
}
