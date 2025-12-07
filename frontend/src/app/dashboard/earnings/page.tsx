"use client";

import { useState, useEffect } from "react";
import { getStoredUser, User } from "@/lib/auth";

export default function EarningsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const isAnnotator = user?.role === "annotator";

  if (!isAnnotator) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Billing & Payments
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage your payment methods and view invoices
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
            💳
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Stripe Integration Coming Soon
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Soon you'll be able to add payment methods and manage billing for
            your projects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Earnings
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Track your earnings and manage payouts
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Available Balance
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            $0.00
          </p>
          <button className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
            Withdraw
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pending Earnings
          </p>
          <p className="mt-2 text-3xl font-bold text-yellow-600">$0.00</p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Earnings from tasks awaiting approval
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Earned
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">$0.00</p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Lifetime earnings on LinguaLabel
          </p>
        </div>
      </div>

      {/* Stripe Connect Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Set Up Payouts
        </h3>
        <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
          Connect your bank account or debit card to receive payments. We use
          Stripe for secure, fast payouts.
        </p>
        <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          Connect with Stripe
        </button>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Transaction History
        </h3>
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
            📄
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            No transactions yet
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Complete tasks to start earning
          </p>
        </div>
      </div>
    </div>
  );
}
