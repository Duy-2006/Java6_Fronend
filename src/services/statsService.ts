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
export async function getDashboardStats(range: string = 'year', startDate?: string, endDate?: string): Promise<any> {
  let url = `${BASE_URL}/api/admin/stats?range=${range}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;

  const res = await authFetch(url, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
      throw new Error('Phiên đăng nhập hết hạn');
    }
    
    // Ghi lỗi ra log thay vì ném lỗi (throw Error) làm sập màn hình
    console.error("Lỗi tải số liệu thống kê từ Backend.");
    
    // Trả về dữ liệu trống mặc định bằng số 0 để giữ giao diện an toàn
    return {
      totalOrders: 0,
      processingOrders: 0,
      completedRevenue: 0
    };
  }

  return res.json();
}