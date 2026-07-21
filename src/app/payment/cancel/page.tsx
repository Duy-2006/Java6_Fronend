'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-5xl">
          ✕
        </div>
        <h1 className="text-3xl font-semibold mb-3">Thanh toán bị hủy</h1>
        <p className="text-gray-600 mb-6">Bạn đã hủy thanh toán. Đơn hàng vẫn chưa được hoàn tất.</p>

        <div className="space-y-3">
          <Link href="/user/cart" className="block rounded-xl bg-red-600 text-white py-3 text-sm font-semibold hover:bg-red-700 transition">
            Quay lại giỏ hàng
          </Link>
          <Link href="/user/checkout" className="block rounded-xl border border-gray-200 text-gray-700 py-3 text-sm font-semibold hover:bg-gray-50 transition">
            Hoàn tất đặt hàng lại
          </Link>
          <Link href="/" className="block rounded-xl bg-gray-100 text-gray-700 py-3 text-sm font-semibold hover:bg-gray-200 transition">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
