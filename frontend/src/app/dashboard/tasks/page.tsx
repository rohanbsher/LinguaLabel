"use client";

import { useState, useEffect } from "react";
import { getStoredUser, User } from "@/lib/auth";
import { api, Project, Task, Language } from "@/lib/api";

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = getStoredUser();
      setUser(storedUser);

      try {
        const [projectsResponse, languagesData] = await Promise.all([
          api.getProjects(),
          api.getLanguages(),
        ]);
        setProjects(projectsResponse.projects);
        setLanguages(languagesData);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const loadTasks = async (projectId: string) => {
    try {
      const response = await api.getTasks(projectId);
      setTasks(response.tasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    loadTasks(project.id);
  };

  const handleSyncLabelStudio = async () => {
    if (!selectedProject) return;

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const response = await api.syncWithLabelStudio(selectedProject.id);
      setSyncMessage(response.message);

      if (response.label_studio_url) {
        // Optionally open Label Studio in a new tab
        window.open(response.label_studio_url, "_blank");
      }
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const isAnnotator = user?.role === "annotator";
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

      {/* Project Selector for Clients */}
      {isClient && projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedProject?.id || ""}
            onChange={(e) => {
              const project = projects.find((p) => p.id === e.target.value);
              if (project) handleProjectSelect(project);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">Select a Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.total_tasks} tasks)
              </option>
            ))}
          </select>

          {selectedProject && (
            <button
              onClick={handleSyncLabelStudio}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <span className="animate-spin">...</span>
                  Syncing...
                </>
              ) : (
                <>
                  <span>🏷️</span>
                  Open in Label Studio
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Sync Message */}
      {syncMessage && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          {syncMessage}
        </div>
      )}

      {/* Filters for Annotators */}
      {isAnnotator && (
        <div className="flex flex-wrap gap-4">
          <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.native_name} ({lang.name})
              </option>
            ))}
          </select>

          <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <option value="">All Types</option>
            <option value="classification">Classification</option>
            <option value="ner">Named Entity Recognition</option>
            <option value="sentiment">Sentiment Analysis</option>
            <option value="transcription">Transcription</option>
          </select>

          <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <option value="">Sort By</option>
            <option value="price-high">Highest Paying</option>
            <option value="price-low">Lowest Paying</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      )}

      {/* Selected Project Info */}
      {selectedProject && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {selectedProject.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {languages.find((l) => l.code === selectedProject.language_code)?.native_name || selectedProject.language_code}
                {" • "}
                {selectedProject.annotation_type}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedProject.completed_tasks}/{selectedProject.total_tasks}
              </div>
              <div className="text-sm text-slate-500">tasks completed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${selectedProject.total_tasks > 0 ? (selectedProject.completed_tasks / selectedProject.total_tasks) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Label Studio Status */}
          {selectedProject.label_studio_project_id ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <span>✓</span>
              Connected to Label Studio (Project #{selectedProject.label_studio_project_id})
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <span>⚠</span>
              Not synced with Label Studio
            </div>
          )}
        </div>
      )}

      {/* Tasks List */}
      {selectedProject && tasks.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Tasks ({tasks.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {tasks.slice(0, 10).map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
            {tasks.length > 10 && (
              <div className="p-4 text-center text-sm text-slate-500">
                And {tasks.length - 10} more tasks...
              </div>
            )}
          </div>
        </div>
      ) : selectedProject ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
            ✏️
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            No tasks in this project
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Add tasks to this project to start annotating.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
            📁
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {projects.length === 0 ? "No projects yet" : "Select a project"}
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {projects.length === 0
              ? "Create a project first, then add tasks to it."
              : "Choose a project from the dropdown to view its tasks."}
          </p>
        </div>
      )}

      {/* Label Studio Integration Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Label Studio Integration
        </h3>
        <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
          {selectedProject?.label_studio_project_id
            ? "Your project is connected to Label Studio. Click 'Open in Label Studio' to start annotating with the full-featured annotation interface."
            : "Click 'Open in Label Studio' to sync your project and access the professional annotation interface with support for text, audio, and image annotations."}
        </p>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const statusColors = {
    available: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    assigned: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    in_progress: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    submitted: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    under_review: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    approved: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  // Extract preview text from task data
  const previewText = task.data.text as string || JSON.stringify(task.data).slice(0, 100);

  return (
    <div className="flex items-center justify-between p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-900 dark:text-white">
          {previewText.length > 80 ? `${previewText.slice(0, 80)}...` : previewText}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          ID: {task.id.slice(0, 8)}...
          {task.label_studio_task_id && ` • LS Task #${task.label_studio_task_id}`}
        </p>
      </div>
      <span
        className={`ml-4 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[task.status]}`}
      >
        {task.status.replace("_", " ")}
      </span>
    </div>
  );
}
