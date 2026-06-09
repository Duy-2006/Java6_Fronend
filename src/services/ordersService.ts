import { authFetch } from "@/lib/authFetch";
// src/services/ordersService.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

export interface Order {
  id: number;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  orderDate?: string;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount?: number;
  status: string;
}

export async function getAllOrders(): Promise<Order[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders`, { cache: "no-store" }); return res.json();
}

export async function getOrderById(id: number | string): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders/${id}`, { cache: "no-store" }); return res.json();
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return res.json();
}

export async function updateOrder(id: number | string, data: Partial<Order>): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return res.json();
}

export async function updateOrderStatus(id: number | string, status: string): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); return res.json();
}

export async function deleteOrder(id: number | string): Promise<void> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
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