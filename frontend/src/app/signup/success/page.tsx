"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SignupSuccessPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "annotator";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900/30">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {type === "annotator"
            ? "Welcome to LinguaLabel!"
            : "Your Project Has Been Created!"}
        </h1>

        <p className="mt-4 text-slate-600 dark:text-slate-400">
          {type === "annotator"
            ? "Your annotator profile has been created. You'll receive an email once your account is approved and you can start taking on annotation tasks."
            : "We've received your project request. Our team will review it and get back to you within 24 hours."}
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Return to Home
          </Link>

          <Link
            href="/login"
            className="block rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
