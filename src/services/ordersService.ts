// src/services/ordersService.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const logoutAndRedirect = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  }
};

export const isLoggedIn = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('token');
  }
  return false;
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    logoutAndRedirect();
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
  }
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Lỗi ${res.status}: ${errorText || res.statusText}`);
  }
  return res.json();
};

export interface Order {
  id: number;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  orderDate?: string;
  totalAmount?: number;
  shippingFee?: number | null;
  status: string;
}

export async function getAllOrders(): Promise<Order[]> {
  return authFetch(`${BASE_URL}/api/admin/orders`, { cache: 'no-store' });
}

export async function getOrderById(id: number | string): Promise<Order> {
  return authFetch(`${BASE_URL}/api/admin/orders/${id}`, { cache: 'no-store' });
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  return authFetch(`${BASE_URL}/api/admin/orders`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrder(id: number | string, data: Partial<Order>): Promise<Order> {
  return authFetch(`${BASE_URL}/api/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateOrderStatus(id: number | string, status: string): Promise<Order> {
  return authFetch(`${BASE_URL}/api/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteOrder(id: number | string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/admin/orders/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (res.status === 401) {
    logoutAndRedirect();
    throw new Error('Token hết hạn');
  }
  if (!res.ok) throw new Error('Xóa đơn hàng thất bại');
}

export const ordersService = {
  getAll: getAllOrders,
  getById: getOrderById,
  create: createOrder,
  update: updateOrder,
  updateStatus: updateOrderStatus,
  delete: deleteOrder,
};