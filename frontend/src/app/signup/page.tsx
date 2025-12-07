"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

// Supported languages for Phase 1
const LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिन्दी", region: "South Asia" },
  { code: "bn", name: "Bengali", native: "বাংলা", region: "South Asia" },
  { code: "sw", name: "Swahili", native: "Kiswahili", region: "East Africa" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", region: "West Africa" },
  { code: "ha", name: "Hausa", native: "Hausa", region: "West Africa" },
  { code: "ar-eg", name: "Egyptian Arabic", native: "مصري", region: "Middle East" },
  { code: "ar-gulf", name: "Gulf Arabic", native: "خليجي", region: "Middle East" },
];

const PROFICIENCY_LEVELS = [
  { value: "native", label: "Native Speaker" },
  { value: "fluent", label: "Fluent" },
  { value: "advanced", label: "Advanced" },
  { value: "intermediate", label: "Intermediate" },
];

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = searchParams.get("role") || "annotator";

  const [role, setRole] = useState<"annotator" | "client">(
    initialRole === "client" ? "client" : "annotator"
  );
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    country: "",
    languages: [] as { code: string; proficiency: string }[],
    availableHours: "",
    bio: "",
    companyName: "",
    projectDescription: "",
  });

  const handleLanguageToggle = (langCode: string) => {
    setFormData((prev) => {
      const existing = prev.languages.find((l) => l.code === langCode);
      if (existing) {
        return {
          ...prev,
          languages: prev.languages.filter((l) => l.code !== langCode),
        };
      } else {
        return {
          ...prev,
          languages: [...prev.languages, { code: langCode, proficiency: "native" }],
        };
      }
    });
  };

  const handleProficiencyChange = (langCode: string, proficiency: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.map((l) =>
        l.code === langCode ? { ...l, proficiency } : l
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (role === "annotator") {
        // Create annotator account
        const hasNativeSpeaker = formData.languages.some(
          (l) => l.proficiency === "native"
        );

        await api.createAnnotator({
          email: formData.email,
          name: formData.fullName,
          languages: formData.languages.map((l) => l.code),
          country: formData.country,
          is_native_speaker: hasNativeSpeaker,
        });

        // Redirect to success page or dashboard
        router.push("/signup/success?type=annotator");
      } else {
        // Create project for client
        if (formData.languages.length > 0) {
          await api.createProject({
            name: `${formData.companyName} Project`,
            description: formData.projectDescription,
            language_code: formData.languages[0].code,
            annotation_type: "classification",
            instructions: formData.projectDescription,
            price_per_task: 0.10,
          });
        }

        router.push("/signup/success?type=client");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900 dark:text-white"
          >
            <span className="text-2xl">🌍</span>
            <span className="text-xl font-bold">LinguaLabel</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Role Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
            <button
              onClick={() => setRole("annotator")}
              className={`rounded-md px-6 py-2 text-sm font-medium transition ${
                role === "annotator"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              I'm an Annotator
            </button>
            <button
              onClick={() => setRole("client")}
              className={`rounded-md px-6 py-2 text-sm font-medium transition ${
                role === "client"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              I'm an AI Company
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {role === "annotator"
              ? "Become an Annotator"
              : "Start Your Project"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {role === "annotator"
              ? "Earn money annotating data in your native language"
              : "Access native speakers for your AI training data"}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Country
                  </label>
                  <select
                    required
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="IN">India</option>
                    <option value="BD">Bangladesh</option>
                    <option value="NG">Nigeria</option>
                    <option value="KE">Kenya</option>
                    <option value="TZ">Tanzania</option>
                    <option value="EG">Egypt</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {role === "client" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      placeholder="Your company name"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 2: Language Selection (Annotators) or Project Details (Clients) */}
            {step === 2 && role === "annotator" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Your Languages
                  </label>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Choose all languages you can annotate
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => {
                      const isSelected = formData.languages.some(
                        (l) => l.code === lang.code
                      );
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageToggle(lang.code)}
                          className={`flex flex-col rounded-lg border p-4 text-left transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                          }`}
                        >
                          <span className="text-lg font-medium text-slate-900 dark:text-white">
                            {lang.native}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {lang.name}
                          </span>
                          <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {lang.region}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.languages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Set Proficiency Levels
                    </label>
                    <div className="mt-3 space-y-3">
                      {formData.languages.map((lang) => {
                        const langInfo = LANGUAGES.find(
                          (l) => l.code === lang.code
                        );
                        return (
                          <div
                            key={lang.code}
                            className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                          >
                            <span className="font-medium text-slate-900 dark:text-white">
                              {langInfo?.name}
                            </span>
                            <select
                              value={lang.proficiency}
                              onChange={(e) =>
                                handleProficiencyChange(
                                  lang.code,
                                  e.target.value
                                )
                              }
                              className="rounded-md border border-slate-300 px-3 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                            >
                              {PROFICIENCY_LEVELS.map((level) => (
                                <option key={level.value} value={level.value}>
                                  {level.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hours Available Per Week
                  </label>
                  <select
                    value={formData.availableHours}
                    onChange={(e) =>
                      setFormData({ ...formData, availableHours: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select availability</option>
                    <option value="1-5">1-5 hours</option>
                    <option value="5-10">5-10 hours</option>
                    <option value="10-20">10-20 hours</option>
                    <option value="20-40">20-40 hours</option>
                    <option value="40+">40+ hours (full-time)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Short Bio (Optional)
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="Tell us about your background and experience..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={formData.languages.length === 0 || isLoading}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </>
            )}

            {step === 2 && role === "client" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    What languages do you need?
                  </label>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => {
                      const isSelected = formData.languages.some(
                        (l) => l.code === lang.code
                      );
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageToggle(lang.code)}
                          className={`flex flex-col rounded-lg border p-4 text-left transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                          }`}
                        >
                          <span className="text-lg font-medium text-slate-900 dark:text-white">
                            {lang.native}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {lang.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Describe Your Project
                  </label>
                  <textarea
                    value={formData.projectDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectDescription: e.target.value,
                      })
                    }
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    placeholder="What kind of annotation do you need? (NER, sentiment analysis, transcription, etc.)"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? "Creating..." : "Get Started"}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
