
import { api } from "./client";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const formData = new URLSearchParams();

  formData.append("username", credentials.username);
  formData.append("password", credentials.password);

  const response = await api.post<LoginResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/users/me");
  return response.data;
}

export function saveAuth(data: LoginResponse) {
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", data.role);
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function getRole() {
  return localStorage.getItem("user_role");
}