// src/types/index.ts
export interface Admin {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface RegisterPayload {
  admin_id: string;
  fullname: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  admin: Admin;
  message?: string;
  code: number;
}

export interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  code: number;
  data?: T;
}

export interface ApiError {
  status: string;
  message: string;
  code: number;
}
