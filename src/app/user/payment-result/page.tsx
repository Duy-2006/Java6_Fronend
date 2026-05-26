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

  // Hiển thị loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center bg-white border border-[#e5e5e7] p-12 rounded-[32px] shadow-sm max-w-sm w-full mx-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C92127] border-t-transparent mx-auto"></div>
          <p className="mt-5 text-[#86868b] font-semibold text-sm tracking-tight">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    );
  }

  // Hiển thị kết quả thành công
  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4">
        <div className="bg-white border border-[#e5e5e7] rounded-[32px] p-8 md:p-12 max-w-[500px] w-full text-center transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
          
          {/* Animated pulsing success checkmark circle */}
          <div className="w-20 h-20 bg-[#34c759]/8 text-[#008a00] rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-[#34c759]/5 scale-100">
            <svg className="w-9 h-9 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0a1317] tracking-tight mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-[#86868b] text-sm font-semibold tracking-tight mb-8">
            {result.message}
          </p>

          <div className="bg-[#f5f5f7] border border-[#e5e5e7] rounded-[24px] p-6 mb-8 text-left space-y-4">
            <div>
              <p className="text-[#86868b] text-[10px] font-extrabold uppercase tracking-widest">Mã đơn hàng</p>
              <p className="text-lg font-bold text-[#C92127] font-mono mt-0.5">{result.orderId}</p>
            </div>

            <div className="border-t border-[#e5e5e7]/80 pt-3">
              <p className="text-[#86868b] text-[10px] font-extrabold uppercase tracking-widest">Tổng số tiền</p>
              <p className="text-xl font-extrabold text-[#0a1317] tracking-tight mt-0.5">
                {result.amount?.toLocaleString('vi-VN')} đ
              </p>
            </div>

            {result.transactionNo && (
              <div className="border-t border-[#e5e5e7]/80 pt-3">
                <p className="text-[#86868b] text-[10px] font-extrabold uppercase tracking-widest">Mã giao dịch</p>
                <p className="text-xs font-mono text-[#1c1c1e] bg-white border border-[#e5e5e7] px-2.5 py-1.5 rounded-lg inline-block max-w-full select-all truncate mt-1">
                  {result.transactionNo}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href={`/user/orders/${result.orderId}`}  
              className="w-full bg-[#C92127] hover:bg-[#A8171C] text-white py-3.5 rounded-full font-bold text-sm tracking-tight transition active:scale-95 duration-150 flex items-center justify-center gap-1.5 shadow-sm"
            >
              Xem chi tiết đơn hàng
              <span className="material-symbols-outlined text-base">receipt_long</span>
            </Link>
            <Link
              href="/"
              className="w-full bg-transparent text-[#0a1317] border-2 border-[#0a1317] py-3 rounded-full font-bold text-sm tracking-tight transition hover:bg-[#0a1317] hover:text-white active:scale-95 duration-200 flex items-center justify-center gap-1.5 shadow-sm"
            >
              Tiếp tục mua sắm
              <span className="material-symbols-outlined text-base">shopping_bag</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị kết quả thất bại
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4">
      <div className="bg-white border border-[#e5e5e7] rounded-[32px] p-8 md:p-12 max-w-[500px] w-full text-center transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.02)]">
        
        {/* Pulsing failure cross circle */}
        <div className="w-20 h-20 bg-[#C92127]/8 text-[#C92127] rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-[#C92127]/5">
          <svg className="w-9 h-9 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" strokeWidth="3" />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0a1317] tracking-tight mb-2">
          Thanh toán thất bại
        </h1>
        <p className="text-[#86868b] text-sm font-semibold tracking-tight mb-8">
          {result?.message || 'Có lỗi xảy ra trong quá trình thanh toán'}
        </p>

        <div className="space-y-3">
          <Link
            href="/user/cart"
            className="w-full bg-[#C92127] hover:bg-[#A8171C] text-white py-3.5 rounded-full font-bold text-sm tracking-tight transition active:scale-95 duration-150 flex items-center justify-center gap-1.5 shadow-sm"
          >
            Quay lại giỏ hàng
            <span className="material-symbols-outlined text-base">shopping_cart</span>
          </Link>
          <Link
            href="/"
            className="w-full bg-transparent text-[#0a1317] border-2 border-[#0a1317] py-3 rounded-full font-bold text-sm tracking-tight transition hover:bg-[#0a1317] hover:text-white active:scale-95 duration-200 flex items-center justify-center gap-1.5 shadow-sm"
          >
            Về trang chủ
            <span className="material-symbols-outlined text-base">home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Export component được bọc Suspense để tuân thủ yêu cầu của Next.js
export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center bg-white border border-[#e5e5e7] p-12 rounded-[32px] shadow-sm max-w-sm w-full mx-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C92127] border-t-transparent mx-auto"></div>
          <p className="mt-5 text-[#86868b] font-semibold text-sm tracking-tight">Đang tải...</p>
        </div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}