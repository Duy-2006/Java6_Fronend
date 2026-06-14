'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PayOSReturnResult {
  success: boolean;
  message: string;
  orderId?: string;
  amount?: number;
  transactionId?: string;
}

export default function PayOSReturnPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<PayOSReturnResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status = searchParams.get('status')?.toLowerCase();
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
    const message = searchParams.get('message') || searchParams.get('error') || '';

    if (status === 'success' && orderId) {
      setResult({
        success: true,
        message: message || 'Thanh toán PayOS thành công',
        orderId,
        amount: amount ? Number(amount) : undefined,
        transactionId: transactionId || undefined,
      });
    } else if (status === 'failure' || status === 'cancel' || status === 'error') {
      setResult({
        success: false,
        message: message || 'Thanh toán PayOS không thành công',
        orderId: orderId || undefined,
      });
    } else {
      setResult({
        success: false,
        message: 'Không nhận được phản hồi hợp lệ từ PayOS. Vui lòng kiểm tra lại đơn hàng.',
      });
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý phản hồi từ PayOS...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className={`mx-auto mb-4 h-20 w-20 rounded-full flex items-center justify-center ${result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <span className="text-5xl">{result.success ? '✓' : '✗'}</span>
          </div>
          <h1 className="text-2xl font-semibold mb-2">{result.success ? 'Thanh toán thành công' : 'Thanh toán không thành công'}</h1>
          <p className="text-sm text-gray-500">{result.message}</p>
        </div>

        {result.orderId && (
          <div className="rounded-2xl bg-gray-50 p-4 mb-5">
            <p className="text-xs uppercase text-gray-400">Mã đơn hàng</p>
            <p className="text-lg font-semibold text-red-600">{result.orderId}</p>
            {typeof result.amount === 'number' && (
              <p className="mt-3 text-sm text-gray-700">Số tiền: <span className="font-semibold">{result.amount.toLocaleString('vi-VN')} đ</span></p>
            )}
            {result.transactionId && (
              <p className="mt-2 text-sm text-gray-700">Mã giao dịch: <span className="font-mono break-all">{result.transactionId}</span></p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {result.orderId && (
            <Link href={`/user/orders/${result.orderId}`} className="block w-full rounded-xl bg-red-600 text-white text-center py-3 font-semibold hover:bg-red-700 transition">
              Xem chi tiết đơn hàng
            </Link>
          )}
          <Link href="/user/cart" className="block w-full rounded-xl border border-gray-300 text-center py-3 text-gray-700 hover:bg-gray-50 transition">
            Quay lại giỏ hàng
          </Link>
          <Link href="/" className="block w-full rounded-xl bg-gray-100 text-center py-3 text-gray-700 hover:bg-gray-200 transition">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
