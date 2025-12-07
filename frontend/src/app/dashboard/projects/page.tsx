"use client";

import { useEffect, useState } from "react";
import { api, Project, Language } from "@/lib/api";
import { getStoredUser, User } from "@/lib/auth";

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = getStoredUser();
      setUser(storedUser);

      try {
        const [projectsData, languagesData] = await Promise.all([
          api.getProjects(),
          api.getLanguages(),
        ]);
        setProjects(projectsData);
        setLanguages(languagesData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const isClient = user?.role === "client";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isClient ? "Your Projects" : "Available Projects"}
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {isClient
              ? "Create and manage your annotation projects"
              : "Browse projects that match your language skills"}
          </p>
        </div>
        {isClient && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Create Project
          </button>
        )}
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
            📁
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            No projects yet
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isClient
              ? "Create your first project to get started with annotation."
              : "There are no projects available at the moment."}
          </p>
          {isClient && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              language={languages.find((l) => l.code === project.language_code)}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          languages={languages}
          onClose={() => setShowCreateModal(false)}
          onCreated={(project) => {
            setProjects([...projects, project]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  language,
}: {
  project: Project;
  language?: Language;
}) {
  const statusColors = {
    draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    active: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    completed: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    paused: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {language?.native_name || project.language_code}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
            statusColors[project.status as keyof typeof statusColors]
          }`}
        >
          {project.status}
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
        {project.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
        <div className="text-sm">
          <span className="font-medium text-slate-900 dark:text-white">
            ${project.price_per_task.toFixed(2)}
          </span>
          <span className="text-slate-500 dark:text-slate-400"> / task</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {project.annotation_type}
        </span>
      </div>
    </div>
  );
}

function CreateProjectModal({
  languages,
  onClose,
  onCreated,
}: {
  languages: Language[];
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    language_code: "",
    annotation_type: "classification",
    instructions: "",
    price_per_task: 0.1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const project = await api.createProject(formData);
      onCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Create New Project
        </h2>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Project Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Language
            </label>
            <select
              required
              value={formData.language_code}
              onChange={(e) =>
                setFormData({ ...formData, language_code: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select a language</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native_name} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Annotation Type
            </label>
            <select
              value={formData.annotation_type}
              onChange={(e) =>
                setFormData({ ...formData, annotation_type: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="classification">Classification</option>
              <option value="ner">Named Entity Recognition</option>
              <option value="sentiment">Sentiment Analysis</option>
              <option value="transcription">Transcription</option>
              <option value="translation">Translation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Instructions for Annotators
            </label>
            <textarea
              required
              rows={3}
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Price per Task (USD)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.price_per_task}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price_per_task: parseFloat(e.target.value),
                })
              }
              className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
