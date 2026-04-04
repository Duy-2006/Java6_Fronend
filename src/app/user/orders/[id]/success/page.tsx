import Link from "next/link";
import { notFound } from "next/navigation";

async function getOrder(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function OrderSuccessPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const orderId = searchParams?.orderId;
  if (!orderId) notFound();

  const order = await getOrder(orderId);
  if (!order) notFound();

  const fmt   = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  const items: any[] = order.orderDetails ?? [];

  return (
    <main className="bg-[#f5f5f5] min-h-screen pb-10">
      <div className="max-w-[1200px] mx-auto px-4 py-10 space-y-8">

        {/* Success header */}
        <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Đặt hàng thành công!</h1>
              <p className="text-gray-500 mt-1">Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi.</p>
            </div>
          </div>
          <div className="bg-gray-50 border rounded-2xl px-6 py-4 text-center">
            <p className="text-xs uppercase text-gray-500 font-bold">Mã đơn hàng</p>
            <p className="text-xl font-extrabold text-green-600">{order.orderCode}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Items */}
          <section className="lg:col-span-8 bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-extrabold">📦 Chi tiết đơn hàng</h2>
              <span className="text-sm text-gray-500 font-bold">{items.length} sản phẩm</span>
            </div>
            <div className="divide-y">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_120px_120px] gap-4 items-center px-6 py-5">
                  <div className="font-bold text-sm">{item.book?.title}</div>
                  <div className="text-center text-sm text-gray-500">x{item.quantity}</div>
                  <div className="text-right text-sm text-gray-500">{fmt(item.price ?? 0)} đ</div>
                  <div className="text-right font-extrabold text-sm text-primary">{fmt((item.price ?? 0) * (item.quantity ?? 0))} đ</div>
                </div>
              ))}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-3">
              <h3 className="text-lg font-extrabold">💰 Thanh toán</h3>
              <div className="flex justify-between text-sm"><span>Tổng tiền</span><span>{fmt(order.totalAmount ?? 0)} đ</span></div>
              <div className="flex justify-between text-sm"><span>Phương thức</span><span>{order.paymentMethod}</span></div>
              <div className="flex justify-between font-extrabold text-xl pt-4 mt-2 border-t">
                <span>Tổng cộng</span><span className="text-primary">{fmt(order.totalAmount ?? 0)} đ</span>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-2">
              <h3 className="text-lg font-extrabold">🚚 Giao hàng</h3>
              <p className="text-sm"><strong>Người nhận:</strong> {order.customerName}</p>
              <p className="text-sm"><strong>SĐT:</strong> {order.customerPhone}</p>
              <p className="text-sm"><strong>Địa chỉ:</strong> {order.customerAddress}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="flex-1 border rounded-xl py-3 font-bold text-center hover:bg-gray-50 transition text-sm">Tiếp tục mua</Link>
              <Link href={`/orders/${order.id}`} className="flex-1 bg-primary text-white rounded-xl py-3 font-bold text-center hover:opacity-90 transition text-sm">Xem đơn hàng</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}