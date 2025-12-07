/**
 * API client for LinguaLabel backend
 */

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

export interface Project extends ProjectCreate {
  id: string;
  status: "draft" | "active" | "completed" | "paused";
  task_count: number;
  completed_tasks: number;
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
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
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
  health: () => fetchApi<{ status: string; version: string }>("/health"),

  // Languages
  getLanguages: () => fetchApi<Language[]>("/api/languages"),
  getLanguage: (code: string) => fetchApi<Language>(`/api/languages/${code}`),
  getLanguagesByRegion: (region: string) =>
    fetchApi<Language[]>(`/api/languages/region/${region}`),

  // Annotators
  createAnnotator: (data: AnnotatorCreate) =>
    fetchApi<Annotator>("/api/annotators", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAnnotators: (params?: { language?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.language) searchParams.set("language", params.language);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return fetchApi<Annotator[]>(`/api/annotators${query ? `?${query}` : ""}`);
  },
  getAnnotator: (id: string) => fetchApi<Annotator>(`/api/annotators/${id}`),

  // Projects
  createProject: (data: ProjectCreate) =>
    fetchApi<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProjects: (params?: { language?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.language) searchParams.set("language", params.language);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return fetchApi<Project[]>(`/api/projects${query ? `?${query}` : ""}`);
  },
  getProject: (id: string) => fetchApi<Project>(`/api/projects/${id}`),

  // Stats
  getStats: () => fetchApi<PlatformStats>("/api/stats"),
};

export default api;
