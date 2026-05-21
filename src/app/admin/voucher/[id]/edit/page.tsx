"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VoucherForm, { VoucherFormData } from "@/app/admin/voucher/_components/VoucherFrom";

export default function EditVoucherPage() {
  const { id } = useParams();
  const router = useRouter();
 const [initialData, setInitialData] = useState<VoucherFormData | null>(null); // ← sửa kiểu
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVoucher = async () => {
      const token = localStorage.getItem("Token") || localStorage.getItem("token") || "";
      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
        const res = await fetch(`http://localhost:8080/api/vouchers/admin/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không tìm thấy voucher");
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
      } catch (err) {
        router.push("/admin/voucher");
      } finally {
        setLoading(false);
      }
    };
    fetchVoucher();
  }, [id, router]);

  if (loading) return <div>Đang tải...</div>;
  if (!initialData) return null;

  return <VoucherForm initialData={initialData} isEdit />;
}