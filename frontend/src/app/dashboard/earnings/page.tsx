"use client";

import { useState, useEffect } from "react";
import { getStoredUser, User } from "@/lib/auth";
import { api, ConnectStatus, Earnings } from "@/lib/api";

export default function EarningsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = getStoredUser();
      setUser(storedUser);

      if (storedUser?.role === "annotator") {
        try {
          const [status, earningsData] = await Promise.all([
            api.getConnectStatus(),
            api.getEarnings(),
          ]);
          setConnectStatus(status);
          setEarnings(earningsData);
        } catch (error) {
          console.error("Failed to load payment data:", error);
          // Set default values if API fails (e.g., annotator profile not set up)
          setConnectStatus({
            account_id: null,
            is_connected: false,
            charges_enabled: false,
            payouts_enabled: false,
            details_submitted: false,
            requirements_due: [],
            message: "Complete your annotator profile to access payments",
          });
          setEarnings({
            total_earned: 0,
            pending: 0,
            available: 0,
            currency: "USD",
          });
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    setMessage(null);

    try {
      const currentUrl = window.location.origin;
      const response = await api.startConnectOnboarding(
        "US",
        `${currentUrl}/dashboard/earnings?connected=true`,
        `${currentUrl}/dashboard/earnings?refresh=true`
      );

      // Redirect to Stripe onboarding
      window.location.href = response.onboarding_url;
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to start onboarding",
      });
      setIsConnecting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    if (earnings && amount > earnings.available) {
      setMessage({ type: "error", text: `Maximum available: $${earnings.available.toFixed(2)}` });
      return;
    }

    setIsWithdrawing(true);
    setMessage(null);

    try {
      const response = await api.requestWithdrawal(amount);
      setMessage({ type: "success", text: response.message });
      setWithdrawAmount("");

      // Refresh earnings
      const updatedEarnings = await api.getEarnings();
      setEarnings(updatedEarnings);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Withdrawal failed",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const isAnnotator = user?.role === "annotator";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  // Client view - Billing & Payments placeholder
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

  // Annotator view - Earnings dashboard
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

      {/* Message Alert */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Available Balance
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            ${earnings?.available.toFixed(2) || "0.00"}
          </p>
          <button
            onClick={() => {
              if (earnings?.available && earnings.available > 0) {
                setWithdrawAmount(earnings.available.toString());
              }
            }}
            disabled={!connectStatus?.payouts_enabled || !earnings?.available || earnings.available <= 0}
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Withdraw
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pending Earnings
          </p>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            ${earnings?.pending.toFixed(2) || "0.00"}
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Earnings from tasks awaiting approval
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Earned
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            ${earnings?.total_earned.toFixed(2) || "0.00"}
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Lifetime earnings on LinguaLabel
          </p>
        </div>
      </div>

      {/* Withdraw Form */}
      {connectStatus?.payouts_enabled && earnings && earnings.available > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Request Withdrawal
          </h3>
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={earnings.available}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
            >
              {isWithdrawing ? "Processing..." : "Withdraw"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Funds typically arrive in 1-2 business days
          </p>
        </div>
      )}

      {/* Stripe Connect Banner */}
      {!connectStatus?.payouts_enabled && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            {connectStatus?.is_connected ? "Complete Your Account Setup" : "Set Up Payouts"}
          </h3>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            {connectStatus?.is_connected
              ? "Your Stripe account is connected but needs additional information to enable payouts."
              : "Connect your bank account or debit card to receive payments. We use Stripe for secure, fast payouts."}
          </p>
          {connectStatus?.requirements_due && connectStatus.requirements_due.length > 0 && (
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Requirements: {connectStatus.requirements_due.join(", ")}
            </p>
          )}
          <button
            onClick={handleConnectStripe}
            disabled={isConnecting}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isConnecting
              ? "Connecting..."
              : connectStatus?.is_connected
              ? "Complete Setup"
              : "Connect with Stripe"}
          </button>
        </div>
      )}

      {/* Connected Account Status */}
      {connectStatus?.payouts_enabled && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Stripe Account Connected
            </h3>
          </div>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            Your account is fully set up and ready to receive payouts.
          </p>
        </div>
      )}

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
