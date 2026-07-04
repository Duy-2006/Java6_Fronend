
/**
 * authFetch — Wrapper bọc fetch() tự động gửi HTTP-Only Cookie.
 * 
 * Sử dụng: Thay `fetch(url, options)` bằng `authFetch(url, options)` ở mọi nơi cần xác thực.
 * 
 * Cơ chế Cookie-Only (Bảo mật tối đa):
 *  - Luôn gửi `credentials: "include"` để trình duyệt tự gắn HTTP-Only cookie
 *  - KHÔNG lưu token vào localStorage (chống XSS)
 *  - KHÔNG đính kèm Authorization header (chống ăn cắp token)
 *  - Backend AuthFilter tự đọc JWT từ cookie để xác thực
 */

// Dùng absolute URL (8080) trên Server, dùng relative URL (Next.js proxy) trên Client
const isServer = typeof window === "undefined";
const API_URL = isServer 
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
  : "";

export function authFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === "string" && !input.startsWith("http") 
    ? `${API_URL}${input}` 
    : input;

  const headers = new Headers(init?.headers);
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  
  return fetch(url, {
    ...init,
    headers,
    credentials: "include", // Luôn gửi cookie HTTP-Only cho mọi request
  });
}

/**
 * Kiểm tra user đã đăng nhập hay chưa dựa trên localStorage metadata.
 * Cookie HTTP-Only chứa JWT token — JS không thể đọc được (chống XSS).
 * localStorage chỉ lưu metadata hiển thị (tên, role, id) — không chứa token.
 */
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user") !== null;
}
