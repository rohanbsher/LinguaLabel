import Link from "next/link";

// Supported languages for Phase 1
const LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिन्दी", speakers: "600M+" },
  { code: "bn", name: "Bengali", native: "বাংলা", speakers: "230M+" },
  { code: "sw", name: "Swahili", native: "Kiswahili", speakers: "100M+" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", speakers: "45M+" },
  { code: "ar", name: "Arabic", native: "العربية", speakers: "400M+" },
  { code: "ha", name: "Hausa", native: "Hausa", speakers: "80M+" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                LinguaLabel
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/annotators"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                For Annotators
              </Link>
              <Link
                href="/clients"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                For AI Companies
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              AI Training Data for
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Underserved Languages
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Connect with native speakers of low-resource languages. Build
              world-class AI models that serve the{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                3 billion people
              </span>{" "}
              whose languages are underserved by AI.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/signup?role=client"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Start a Project
              </Link>
              <Link
                href="/signup?role=annotator"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                Become an Annotator
              </Link>
            </div>
          </div>

          {/* Language Grid */}
          <div className="mt-24">
            <h2 className="text-center text-lg font-semibold text-slate-600 dark:text-slate-400">
              Currently supporting native speakers in
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
                >
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {lang.native}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {lang.name}
                  </p>
                  <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {lang.speakers} speakers
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-32 grid gap-12 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900">
                🎯
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                Purpose-Built Tools
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Annotation tools designed for RTL scripts, complex Unicode, and
                audio transcription in low-resource languages.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl dark:bg-purple-900">
                👥
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                Native Speaker Network
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Access vetted native speakers from diaspora communities and
                in-country experts that other platforms can't reach.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl dark:bg-green-900">
                ✅
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                Quality First
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Multi-annotator consensus, expert review tiers, and automated
                quality scoring ensure high-quality training data.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-32 rounded-2xl bg-slate-900 p-8 dark:bg-slate-800 lg:p-12">
            <div className="grid gap-8 text-center lg:grid-cols-4">
              <div>
                <p className="text-4xl font-bold text-white">3B+</p>
                <p className="mt-2 text-slate-400">
                  People speaking underserved languages
                </p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white">7,000+</p>
                <p className="mt-2 text-slate-400">
                  Languages, only ~20 with good NLP
                </p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white">$29B</p>
                <p className="mt-2 text-slate-400">
                  AI annotation market by 2034
                </p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white">80%</p>
                <p className="mt-2 text-slate-400">
                  Manual work reduced by AI assist
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-32 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ready to build inclusive AI?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              Whether you're an AI company looking for training data or a native
              speaker wanting to earn while preserving your language, we're here
              to help.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/contact"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Contact Us
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
              >
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌍</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                LinguaLabel
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Serving the 3 billion people whose languages are underserved by
              AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
