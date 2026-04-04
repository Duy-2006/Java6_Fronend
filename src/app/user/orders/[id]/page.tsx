import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Chờ xử lý",  cls: "text-yellow-600" },
  CONFIRMED: { label: "Đã xác nhận",cls: "text-blue-600"   },
  SHIPPING:  { label: "Đang giao",  cls: "text-purple-600" },
  COMPLETED: { label: "Hoàn tất",   cls: "text-green-600"  },
  CANCELLED: { label: "Đã hủy",    cls: "text-red-600"    },
};

async function getOrder(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const o = await getOrder(params.id);
  return { title: o ? `Đơn hàng ${o.orderCode}` : "Chi tiết đơn hàng" };
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) notFound();

  const fmt   = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  const st    = STATUS_MAP[order.status] ?? { label: order.status, cls: "text-gray-600" };
  const items: any[] = order.orderDetails ?? [];

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">Chi tiết đơn hàng</h1>
            <p className="text-gray-500 mt-1">Mã đơn: <span className="font-bold text-blue-600">{order.orderCode}</span></p>
          </div>
          <Link href="/my-orders" className="px-4 py-2 border rounded-xl font-semibold hover:bg-gray-50 transition text-sm">← Quay lại</Link>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            <h2 className="font-bold text-lg">Thông tin đơn hàng</h2>
            <p className="text-sm">Ngày đặt: <span className="font-semibold">{order.orderDate ? new Date(order.orderDate).toLocaleDateString("vi-VN") : "—"}</span></p>
            <p className="text-sm">Trạng thái: <span className={`font-bold ${st.cls}`}>{st.label}</span></p>
            <p className="text-sm">Thanh toán: <span className="font-semibold">{order.paymentMethod}</span> — <span>{order.paymentStatus}</span></p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            <h2 className="font-bold text-lg">Thông tin giao hàng</h2>
            <p className="text-sm">Người nhận: <span className="font-semibold">{order.customerName}</span></p>
            <p className="text-sm">SĐT: <span>{order.customerPhone}</span></p>
            <p className="text-sm">Địa chỉ: <span>{order.customerAddress}</span></p>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg">Sản phẩm đã mua</h2>
            <span className="text-sm text-gray-500 font-semibold">{items.length} sản phẩm</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Sản phẩm</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-600">Số lượng</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Đơn giá</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Tạm tính</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-semibold text-sm">{item.book?.title}</td>
                  <td className="px-6 py-4 text-center text-sm">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-sm">{fmt(item.price ?? 0)} đ</td>
                  <td className="px-6 py-4 text-right font-bold text-sm">{fmt((item.price ?? 0) * (item.quantity ?? 0))} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl shadow p-6 flex justify-end">
          <div className="text-right space-y-1">
            <p className="text-gray-500 text-sm">Tổng thanh toán</p>
            <p className="text-2xl font-extrabold text-blue-600">{fmt(order.totalAmount ?? 0)} ₫</p>
          </div>
        </div>
      </div>
    </div>
  );
}