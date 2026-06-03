// services/passwordService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordRequestDTO {
  email: string;
  otp: string;
  newPassword: string;
}

export interface MessageResponseDTO {
  message: string;
  success: boolean;
}

// Gửi yêu cầu lấy OTP
export async function forgotPassword(data: ForgotPasswordRequestDTO): Promise<MessageResponseDTO> {
  const res = await fetch(`${API_URL }/api/auth/forgot-password`, {
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

// Xác thực OTP và đặt lại mật khẩu
export async function verifyOtp(data: ResetPasswordRequestDTO): Promise<MessageResponseDTO> {
  const res = await fetch(`${API_URL }/api/auth/verify-otp`, {
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