"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VoucherForm, { VoucherFormData } from "@/app/admin/voucher/_components/VoucherFrom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function EditVoucherPage() {
  const { id } = useParams();
  const router = useRouter();
  const [initialData, setInitialData] = useState<VoucherFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVoucher = async () => {
      const token = localStorage.getItem("Token") || localStorage.getItem("token") || "";
      if (!token) {
        router.push("/admin/login");
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      try {
        const res = await fetch(`${API_URL}/api/vouchers/admin/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không tìm thấy thông tin Voucher yêu cầu.");
        const data = await res.json();
        setInitialData({
          id: data.id,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderValue: data.minOrderValue,
          maxDiscount: data.maxDiscount,
          usageLimit: data.usageLimit,
          startDate: data.startDate,
          endDate: data.endDate,
          active: data.active,
        });
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra khi tải thông tin Voucher.");
      } finally {
        setLoading(false);
      }
    };
    fetchVoucher();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-[400px] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#b70011] animate-spin" />
        <p className="text-sm font-semibold text-[#5c403c] animate-pulse">
          Đang tải dữ liệu Voucher...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-bold text-red-800">Đã xảy ra lỗi</h3>
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/admin/voucher")}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) return null;

  return <VoucherForm initialData={initialData} isEdit />;
}