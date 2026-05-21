const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getDashboardStats(range: string = 'year'): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/admin/stats?range=${range}`, {
    headers: getAuthHeaders(),
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
