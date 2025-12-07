"use client";

import { useState } from "react";
import { getStoredUser, User } from "@/lib/auth";
import { useEffect } from "react";

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const isAnnotator = user?.role === "annotator";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isAnnotator ? "Available Tasks" : "Task Management"}
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {isAnnotator
            ? "Find annotation tasks that match your language skills"
            : "View and manage tasks across your projects"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <option value="">All Languages</option>
          <option value="hi">Hindi</option>
          <option value="bn">Bengali</option>
          <option value="sw">Swahili</option>
          <option value="yo">Yoruba</option>
          <option value="ar-eg">Egyptian Arabic</option>
          <option value="ar-gulf">Gulf Arabic</option>
        </select>

        <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <option value="">All Types</option>
          <option value="classification">Classification</option>
          <option value="ner">Named Entity Recognition</option>
          <option value="sentiment">Sentiment Analysis</option>
          <option value="transcription">Transcription</option>
        </select>

        {isAnnotator && (
          <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <option value="">Sort By</option>
            <option value="price-high">Highest Paying</option>
            <option value="price-low">Lowest Paying</option>
            <option value="newest">Newest First</option>
          </select>
        )}
      </div>

      {/* Empty State */}
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
          ✏️
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          No tasks available
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isAnnotator
            ? "There are no tasks matching your language skills at the moment. Check back soon!"
            : "Create a project and upload data to generate tasks."}
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Label Studio Integration Coming Soon
        </h3>
        <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
          We're integrating with Label Studio to provide a world-class
          annotation experience. You'll be able to annotate text, audio, and
          images with specialized tools for low-resource languages.
        </p>
      </div>
    </div>
  );
}
