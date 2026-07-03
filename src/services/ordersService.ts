/*
 * ordersService.ts
 * Lop service xu ly cac thao tac CRUD doi voi don hang (Order) trong trang Admin.
 * Bao gom: xem danh sach, xem chi tiet, tao moi, cap nhat, doi trang thai, xoa don hang.
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend Spring Boot
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Kieu du lieu cua mot don hang, tuong ung voi OrderDTO ben backend
export interface Order {
  id: number;                  // Ma don hang (tu dong tang)
  orderCode?: string;          // Ma don hang hien thi (vi du: DH20240101001)
  customerName?: string;       // Ten khach hang dat don
  customerPhone?: string;      // So dien thoai khach hang
  orderDate?: string;          // Ngay dat hang (ISO format)
  shippingFee?: number;        // Phi van chuyen (VND)
  discountAmount?: number;     // So tien giam gia (VND)
  totalAmount?: number;        // Tong tien thanh toan (VND)
  status: string;              // Trang thai don hang (PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED)
}

// Lay toan bo danh sach don hang (dung cho trang Admin > Quan ly don hang)
export async function getAllOrders(): Promise<Order[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders`, { cache: "no-store" });
  return res.json();
}

// Lay chi tiet 1 don hang theo ma ID
export async function getOrderById(id: number | string): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders/${id}`, { cache: "no-store" });
  return res.json();
}

// Tao moi don hang (gui thong tin don hang len backend)
export async function createOrder(data: Partial<Order>): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Cap nhat thong tin don hang theo ma ID (sua toan bo)
export async function updateOrder(id: number | string, data: Partial<Order>): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Doi trang thai don hang (vi du: PENDING -> CONFIRMED -> SHIPPING -> DELIVERED)
export async function updateOrderStatus(id: number | string, status: string): Promise<Order> {
  const res = await authFetch(`${BASE_URL}/api/admin/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

// Xoa don hang khoi database theo ma ID
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

// Doi tuong gom nhom tat ca cac ham de import nhanh: ordersService.getAll(), ordersService.create()...
export const ordersService = {
  getAll: getAllOrders,
  getById: getOrderById,
  create: createOrder,
  update: updateOrder,
  updateStatus: updateOrderStatus,
  delete: deleteOrder,
};