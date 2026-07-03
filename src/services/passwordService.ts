/*
 * passwordService.ts
 * Lop service xu ly chuc nang quen mat khau va dat lai mat khau moi.
 * Luong hoat dong: Nguoi dung nhap email -> Backend gui ma OTP qua email -> Nguoi dung nhap OTP + mat khau moi.
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend
const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Du lieu gui len khi yeu cau quen mat khau (chi can email)
export interface ForgotPasswordRequestDTO {
  email: string;
}

// Du lieu gui len khi dat lai mat khau (email + ma OTP + mat khau moi)
export interface ResetPasswordRequestDTO {
  email: string;
  otp: string;
  newPassword: string;
}

// Kieu du lieu tra ve tu backend sau khi xu ly yeu cau
export interface MessageResponseDTO {
  message: string;    // Noi dung thong bao tu backend
  success: boolean;   // Ket qua thanh cong hay that bai
}

// Gui yeu cau quen mat khau - backend se gui ma OTP ve email cua nguoi dung
export async function forgotPassword(data: ForgotPasswordRequestDTO): Promise<MessageResponseDTO> {
  const res = await authFetch(`${API_URL }/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Gửi yêu cầu thất bại.");
  }
  return res.json();
}

// Xac thuc ma OTP va dat lai mat khau moi cho tai khoan
export async function verifyOtp(data: ResetPasswordRequestDTO): Promise<MessageResponseDTO> {
  const res = await authFetch(`${API_URL }/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Xác thực OTP thất bại.");
  }
  return res.json();
}