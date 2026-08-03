'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaymentSuccessState {
  orderId?: string;
  amount?: number;
  transactionId?: string;
  message?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<PaymentSuccessState>({});

  useEffect(() => {
    const orderId = searchParams.get('orderId') || searchParams.get('order_id');
    const amount = searchParams.get('amount');
    const transactionId = searchParams.get('transactionNo') || searchParams.get('transaction_id');
    const message = searchParams.get('message') || 'Thanh toán thành công, cảm ơn bạn đã mua sắm.';

    setInfo({
      orderId: orderId || undefined,
      amount: amount ? Number(amount) : undefined,
      transactionId: transactionId || undefined,
      message,
    });
  }, [searchParams]);

  return (
    <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 text-center">
      <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-5xl">
        ✓
      </div>
      <h1 className="text-3xl font-semibold mb-3">Thanh toán thành công</h1>
      <p className="text-gray-600 mb-6">{info.message}</p>

      {info.orderId && (
        <div className="mb-4 rounded-2xl bg-gray-50 p-4 text-left">
          <p className="text-sm text-gray-500">Mã đơn hàng</p>
          <p className="text-lg font-bold text-red-600">{info.orderId}</p>
          {typeof info.amount === 'number' && (
            <p className="text-sm text-gray-700 mt-3">Số tiền: <span className="font-semibold">{info.amount.toLocaleString('vi-VN')} đ</span></p>
          )}
          {info.transactionId && (
            <p className="text-sm text-gray-700 mt-2">Mã giao dịch: <span className="font-mono break-all">{info.transactionId}</span></p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {info.orderId && (
          <Link href={`/user/orders/${info.orderId}`} className="block rounded-xl bg-red-600 text-white py-3 text-sm font-semibold hover:bg-red-700 transition">
            Xem chi tiết đơn hàng
          </Link>
        )}
        <Link href="/" className="block rounded-xl border border-gray-200 text-gray-700 py-3 text-sm font-semibold hover:bg-gray-50 transition">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <Suspense fallback={
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#b70011]"></div>
          <p className="mt-4 text-slate-500 text-sm">Đang tải...</p>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
