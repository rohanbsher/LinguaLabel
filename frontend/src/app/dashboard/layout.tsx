"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, logout, User } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/projects", label: "Projects", icon: "📁" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "✏️" },
  { href: "/dashboard/earnings", label: "Earnings", icon: "💰" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(storedUser);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-800">
          <span className="text-2xl">🌍</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            LinguaLabel
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {user?.full_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex h-16 items-center justify-between px-8">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              {NAV_ITEMS.find((item) => item.href === pathname)?.label ||
                "Dashboard"}
            </h1>
            <div className="flex items-center gap-4">
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
                🔔
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
