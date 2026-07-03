/*
 * statsService.ts
 * Lop service lay so lieu thong ke cho trang Dashboard cua Admin.
 * Goi API /api/admin/stats de lay du lieu doanh thu, so don hang, so khach hang...
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Tao header cho request API
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// Lay so lieu thong ke tong hop cho Dashboard
// Tham so range: khoang thoi gian thong ke ('day', 'week', 'month', 'year'), mac dinh la 'year'
export async function getDashboardStats(range: string = 'year'): Promise<any> {
  const res = await authFetch(`${BASE_URL}/api/admin/stats?range=${range}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    // Neu backend tra ve 401 thi phien dang nhap da het han, chuyen ve trang login
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
         localStorage.removeItem('token');
         window.location.href = '/auth/login';
      }
      throw new Error('Phiên đăng nhập hết hạn');
    }
    throw new Error('Không thể tải số liệu thống kê.');
  }
  return res.json();
}
