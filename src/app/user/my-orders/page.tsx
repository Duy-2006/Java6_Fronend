"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-gray-200 text-gray-800"    },
  CONFIRMED: { label: "Đã xác nhận",  cls: "bg-blue-100 text-blue-700"    },
  SHIPPING:  { label: "Đang giao",    cls: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Hoàn thành",  cls: "bg-green-100 text-green-700"   },
  CANCELLED: { label: "Đã hủy",      cls: "bg-red-100 text-red-700"       },
};

const STATUS_OPTIONS = ["", "PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"];
const STATUS_LABELS: Record<string, string> = {
  "": "Tất cả", PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy",
};

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = status ? `?status=${status}` : "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/my-orders${q}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [status]);

  const cancelOrder = async (id: number) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}/cancel`, {
      method: "POST", credentials: "include",
    });
    if (res.ok) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "CANCELLED" } : o));
  };

  return (
    <div className="bg-[#f0f0f0] min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Đơn hàng của tôi</h1>
            <p className="text-gray-500 text-sm mt-1">Theo dõi tình trạng đơn hàng của bạn</p>
          </div>
          <Link href="/" className="px-5 py-2 bg-black text-white rounded-xl font-semibold hover:opacity-90 transition text-sm">
            ← Tiếp tục mua sắm
          </Link>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6 flex flex-wrap gap-3 items-center">
          <span className="font-semibold text-gray-700 text-sm">Lọc theo trạng thái:</span>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition border
                  ${status === s ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div className="space-y-4">
          {loading && (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
              <p className="text-xl font-semibold mb-2">Bạn chưa có đơn hàng nào</p>
              <Link href="/" className="text-blue-600 font-bold hover:underline">Bắt đầu mua sắm →</Link>
            </div>
          )}

          {orders.map(order => {
            const st = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-gray-100 text-gray-700" };
            const date = order.orderDate
              ? new Date(order.orderDate).toLocaleString("vi-VN", { day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit" })
              : "—";
            return (
              <div key={order.id} className="bg-white rounded-2xl border p-6 hover:shadow-md transition">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      Mã đơn: <span className="text-black">{order.orderCode}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{date}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-sm font-semibold ${st.cls}`}>{st.label}</span>
                </div>
                <div className="flex flex-wrap justify-between items-center mt-6 pt-4 border-t">
                  <p className="text-xl font-extrabold text-red-600">{fmt(order.totalAmount ?? 0)} đ</p>
                  <div className="flex gap-3 items-center">
                    {order.status === "PENDING" && (
                      <button onClick={() => cancelOrder(order.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition">
                        Hủy đơn
                      </button>
                    )}
                    <Link href={`/orders/${order.id}`}
                      className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">
                      Xem chi tiết →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}