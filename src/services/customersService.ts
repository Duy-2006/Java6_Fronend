import { authFetch } from "@/lib/authFetch";
// src/services/customersService.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

export interface CustomerSummary {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  active: boolean;
  totalSpending: number;
  customerType: string;
  avatar?: string;
}

export interface CustomerHistory extends CustomerSummary {
  orders: any[];
}

export interface ToggleStatusResponse {
  message: string;
  active: boolean;
  username: string;
}



function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

async function handleResponse(response: Response) {
  // Đọc text thay vì json trực tiếp để log
  const text = await response.text();
  console.log('[handleResponse] Raw response (first 500 chars):', text.substring(0, 500));

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
  }

  if (!response.ok) {
    throw new Error(`Lỗi ${response.status}: ${text || response.statusText}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('JSON parse error. Full response text:', text);
    throw new Error('Dữ liệu từ server không đúng định dạng JSON');
  }
}

export async function getAllCustomers(): Promise<CustomerSummary[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/customers`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getCustomerHistory(username: string): Promise<CustomerHistory> {
  const res = await authFetch(`${BASE_URL}/api/admin/customers/history/${username}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function toggleCustomerStatus(username: string): Promise<ToggleStatusResponse> {
  const res = await authFetch(`${BASE_URL}/api/admin/customers/toggle/${username}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse(res);
}