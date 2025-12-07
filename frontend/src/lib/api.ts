/**
 * API client for LinguaLabel backend
 */

import { getStoredToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export interface Language {
  code: string;
  name: string;
  native_name: string;
  script: string;
  direction: "ltr" | "rtl";
  speakers: number;
  region: string;
}

export interface AnnotatorCreate {
  email: string;
  name: string;
  languages: string[];
  country: string;
  is_native_speaker?: boolean;
}

export interface Annotator extends AnnotatorCreate {
  id: string;
  status: "pending" | "approved" | "active" | "inactive";
  rating: number | null;
  tasks_completed: number;
}

export interface ProjectCreate {
  name: string;
  description: string;
  language_code: string;
  annotation_type: string;
  instructions: string;
  price_per_task: number;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string;
  language_code: string;
  annotation_type: string;
  instructions: string;
  price_per_task: number;
  status: "draft" | "active" | "completed" | "paused" | "pending_review" | "cancelled";
  total_tasks: number;
  completed_tasks: number;
  label_studio_project_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  data: Record<string, unknown>;
  status: "available" | "assigned" | "in_progress" | "submitted" | "under_review" | "approved" | "rejected";
  assigned_to: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  time_spent: number | null;
  label_studio_task_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface LabelStudioSyncResponse {
  label_studio_project_id: number | null;
  label_studio_url: string | null;
  synced_tasks: number;
  synced_annotations: number;
  is_available: boolean;
  message: string;
}

export interface PlatformStats {
  languages_supported: number;
  total_speakers_reached: number;
  annotators_registered: number;
  projects_created: number;
  regions: string[];
}

export interface ApiError {
  detail: string;
}

// Helper function for API calls
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { authenticated?: boolean }
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  // Add auth token if authenticated request
  if (options?.authenticated !== false) {
    const token = getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "An error occurred",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

// API functions
export const api = {
  // Health
  health: () => fetchApi<{ status: string; version: string }>("/health", { authenticated: false }),

  // Languages
  getLanguages: () => fetchApi<Language[]>("/api/languages", { authenticated: false }),
  getLanguage: (code: string) => fetchApi<Language>(`/api/languages/${code}`, { authenticated: false }),
  getLanguagesByRegion: (region: string) =>
    fetchApi<Language[]>(`/api/languages/region/${region}`, { authenticated: false }),

  // Annotators
  createAnnotator: (data: AnnotatorCreate) =>
    fetchApi<Annotator>("/api/annotators", {
      method: "POST",
      body: JSON.stringify(data),
      authenticated: false,
    }),
  getAnnotators: (params?: { language?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.language) searchParams.set("language", params.language);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return fetchApi<Annotator[]>(`/api/annotators${query ? `?${query}` : ""}`, { authenticated: false });
  },
  getAnnotator: (id: string) => fetchApi<Annotator>(`/api/annotators/${id}`, { authenticated: false }),

  // Projects (authenticated)
  createProject: (data: ProjectCreate) =>
    fetchApi<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProjects: (params?: { language_code?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.language_code) searchParams.set("language_code", params.language_code);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return fetchApi<ProjectListResponse>(`/api/projects${query ? `?${query}` : ""}`);
  },
  getProject: (id: string) => fetchApi<Project>(`/api/projects/${id}`),
  updateProject: (id: string, data: Partial<ProjectCreate>) =>
    fetchApi<Project>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    fetchApi<void>(`/api/projects/${id}`, {
      method: "DELETE",
    }),
  activateProject: (id: string) =>
    fetchApi<Project>(`/api/projects/${id}/activate`, {
      method: "POST",
    }),

  // Tasks
  addTasks: (projectId: string, tasks: Array<{ data: Record<string, unknown> }>) =>
    fetchApi<TaskListResponse>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ tasks }),
    }),
  getTasks: (projectId: string, params?: { status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return fetchApi<TaskListResponse>(`/api/projects/${projectId}/tasks${query ? `?${query}` : ""}`);
  },

  // Label Studio sync
  syncWithLabelStudio: (projectId: string, syncAnnotations = true) =>
    fetchApi<LabelStudioSyncResponse>(`/api/projects/${projectId}/sync`, {
      method: "POST",
      body: JSON.stringify({ sync_annotations: syncAnnotations }),
    }),

  // Stats
  getStats: () => fetchApi<PlatformStats>("/api/stats", { authenticated: false }),
};

export default api;
