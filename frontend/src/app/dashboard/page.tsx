"use client";

import { useEffect, useState } from "react";
import { api, PlatformStats } from "@/lib/api";
import { getStoredUser, User } from "@/lib/auth";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = getStoredUser();
      setUser(storedUser);

      try {
        const platformStats = await api.getStats();
        setStats(platformStats);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  const isAnnotator = user?.role === "annotator";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.full_name?.split(" ")[0]}! 👋
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isAnnotator
            ? "Ready to start annotating? Check out available tasks below."
            : "Manage your projects and track annotation progress."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isAnnotator ? (
          <>
            <StatCard
              title="Tasks Completed"
              value="0"
              icon="✅"
              color="green"
            />
            <StatCard
              title="Pending Earnings"
              value="$0.00"
              icon="💰"
              color="yellow"
            />
            <StatCard
              title="Total Earned"
              value="$0.00"
              icon="📈"
              color="blue"
            />
            <StatCard
              title="Accuracy Score"
              value="N/A"
              icon="🎯"
              color="purple"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Active Projects"
              value={stats?.projects_created?.toString() || "0"}
              icon="📁"
              color="blue"
            />
            <StatCard
              title="Tasks Created"
              value="0"
              icon="📝"
              color="green"
            />
            <StatCard
              title="Completed Tasks"
              value="0"
              icon="✅"
              color="purple"
            />
            <StatCard
              title="Total Spent"
              value="$0.00"
              icon="💵"
              color="yellow"
            />
          </>
        )}
      </div>

      {/* Platform Stats */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Platform Overview
        </h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats?.languages_supported || 0}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Languages Supported
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats
                ? Math.round(stats.total_speakers_reached / 1000000000)
                : 0}
              B+
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Speakers Reached
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {stats?.annotators_registered || 0}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Annotators
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {stats?.projects_created || 0}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Active Projects
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Quick Actions
        </h3>
        <div className="mt-4 flex flex-wrap gap-4">
          {isAnnotator ? (
            <>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                Browse Tasks
              </button>
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                Update Languages
              </button>
            </>
          ) : (
            <>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                Create Project
              </button>
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                Upload Data
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow:
      "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className={`rounded-lg p-2 text-xl ${colorClasses[color]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{title}</p>
    </div>
  );
}
