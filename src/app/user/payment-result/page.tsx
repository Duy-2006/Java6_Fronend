'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Component chính được bọc trong Suspense để tránh lỗi useSearchParams
function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    orderId?: string;
    amount?: number;
    transactionNo?: string;
  } | null>(null);

  useEffect(() => {
    // Lấy thông tin từ query parameters do Spring Boot redirect về
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const transactionNo = searchParams.get('transactionNo');
    const errorMessage = searchParams.get('message');

    console.log('=== Payment Result from Query ===');
    console.log({ status, orderId, amount, transactionNo });

    if (status === 'success' && orderId && amount) {
      setResult({
        success: true,
        message: 'Thanh toán thành công',
        orderId: orderId,
        amount: parseInt(amount),
        transactionNo: transactionNo || undefined,
      });

      // Lưu trạng thái thanh toán thành công vào localStorage
      localStorage.setItem(
        `payment_${orderId}`,
        JSON.stringify({
          status: 'success',
          transactionNo: transactionNo,
          amount: parseInt(amount),
        })
      );
    } else if (status === 'failure') {
      setResult({
        success: false,
        message: errorMessage || 'Thanh toán thất bại',
        orderId: orderId || undefined,
      });
    } else {
      // Trường hợp không có query params hợp lệ (có thể do truy cập trực tiếp)
      setResult({
        success: false,
        message: 'Yêu cầu không hợp lệ',
      });
    }
    setLoading(false);
  }, [searchParams]);
  const getUserIdFromToken = (): number | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.id || payload.user_id || null;
    } catch {
      return null;
    }
  };
  // Hiển thị loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    );
  }

  // Hiển thị kết quả thành công
  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Thanh toán thành công!</h1>
          <p className="text-gray-600 mb-4">{result.message}</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500">Mã đơn hàng</p>
            <p className="text-lg font-bold text-red-600 mb-2">{result.orderId}</p>

            <p className="text-sm text-gray-500">Số tiền</p>
            <p className="text-lg font-bold">
              {result.amount?.toLocaleString('vi-VN')}đ
            </p>

            {result.transactionNo && (
              <>
                <p className="text-sm text-gray-500 mt-2">Mã giao dịch</p>
                <p className="text-sm font-mono">{result.transactionNo}</p>
              </>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href={`/user/orders/${result.orderId}`}  
              className="block w-full bg-red-600 text-white text-center py-3 rounded-lg hover:bg-red-700 transition"
            >
              Xem chi tiết đơn hàng
            </Link>
            <Link
              href="/"
              className="block w-full border border-red-600 text-red-600 text-center py-3 rounded-lg hover:bg-red-50 transition"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị kết quả thất bại
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-red-500 text-6xl mb-4">✗</div>
        <h1 className="text-2xl font-bold mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-600 mb-6">
          {result?.message || 'Có lỗi xảy ra trong quá trình thanh toán'}
        </p>

        <div className="space-y-3">
          <Link
            href="user/cart"
            className="block w-full bg-red-600 text-white text-center py-3 rounded-lg hover:bg-red-700 transition"
          >
            Quay lại giỏ hàng
          </Link>
          <Link
            href="/"
            className="block w-full border border-gray-600 text-gray-600 text-center py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

// Export component được bọc Suspense để tuân thủ yêu cầu của Next.js
export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Đang tải...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}