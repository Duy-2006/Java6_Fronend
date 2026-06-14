'use client';

import Link from 'next/link';

export default function PayOSCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-5xl">
          ✕
        </div>
        <h1 className="text-2xl font-semibold mb-3">Thanh toán đã bị hủy</h1>
        <p className="text-sm text-gray-500 mb-6">
          Bạn đã hủy thao tác thanh toán PayOS. Đơn hàng của bạn vẫn có thể được hoàn tất bằng cách quay lại giỏ hàng và thử lại.
        </p>

        <div className="space-y-3">
          <Link href="/user/cart" className="block w-full rounded-xl bg-red-600 text-white text-center py-3 font-semibold hover:bg-red-700 transition">
            Quay lại giỏ hàng
          </Link>
          <Link href="/user/checkout" className="block w-full rounded-xl border border-gray-300 text-center py-3 text-gray-700 hover:bg-gray-50 transition">
            Hoàn tất đặt hàng khác
          </Link>
          <Link href="/" className="block w-full rounded-xl bg-gray-100 text-center py-3 text-gray-700 hover:bg-gray-200 transition">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
