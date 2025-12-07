/**
 * Authentication utilities for LinguaLabel
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "lingualabel_token";
const USER_KEY = "lingualabel_user";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "annotator" | "client";
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: "annotator" | "client";
}

export interface LoginData {
  email: string;
  password: string;
}

// Token management
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// API calls
export async function register(data: RegisterData): Promise<User & AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  const result = await response.json();
  setToken(result.access_token);
  setStoredUser(result);
  return result;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  // OAuth2 password flow uses form data
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const result = await response.json();
  setToken(result.access_token);

  // Fetch user info after login
  const user = await getCurrentUser();
  if (user) {
    setStoredUser(user);
  }

  return result;
}

export async function logout(): Promise<void> {
  removeToken();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
    }
    return null;
  }

  return response.json();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
