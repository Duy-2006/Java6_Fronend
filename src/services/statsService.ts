import { authFetch } from "@/lib/authFetch";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";



function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export async function getDashboardStats(range: string = 'year'): Promise<any> {
  const res = await authFetch(`${BASE_URL}/api/admin/stats?range=${range}`, {
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
    throw new Error('Không thể tải số liệu thống kê.');
  }
  return res.json();
}
