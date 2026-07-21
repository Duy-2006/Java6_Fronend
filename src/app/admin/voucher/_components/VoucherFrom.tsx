"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Info, Sparkles, RefreshCw, Calendar, Save, Copy, Check, ChevronRight, HelpCircle
} from "lucide-react";

export interface VoucherFormData {
  id?: number;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number | string;
  minOrderValue: number | string;
  maxDiscount: number | string | null;
  usageLimit: number | string;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface Props {
  initialData?: VoucherFormData;
  isEdit?: boolean;
}

export default function VoucherForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<VoucherFormData>({
    code: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    active: true,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        discountValue: initialData.discountValue ?? "",
        minOrderValue: initialData.minOrderValue ?? "",
        maxDiscount: initialData.maxDiscount ?? "",
        usageLimit: initialData.usageLimit ?? "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    const perc = Number(form.discountValue);
    if (!perc || perc <= 0) return;

    // Đề xuất dựa trên logic backend VoucherService.suggestVoucherSettings
    const suggest = (percentage: number): { minOrderValue: number; maxDiscount: number } => {
      if (percentage <= 10) {
        return { minOrderValue: 200000, maxDiscount: 100000 };
      } else if (percentage <= 15) {
        return { minOrderValue: 300000, maxDiscount: 200000 };
      } else if (percentage <= 20) {
        return { minOrderValue: 400000, maxDiscount: 250000 };
      } else if (percentage <= 25) {
        return { minOrderValue: 500000, maxDiscount: 250000 };
      } else if (percentage <= 30) {
        return { minOrderValue: 600000, maxDiscount: 300000 };
      } else {
        return { minOrderValue: 1000000, maxDiscount: 500000 };
      }
    };


    const { minOrderValue: suggestedMin, maxDiscount: suggestedMax } = suggest(perc);
    // Chỉ tự động điền nếu admin chưa nhập giá trị
    if (!form.minOrderValue) setField('minOrderValue', suggestedMin);
    if (!form.maxDiscount) setField('maxDiscount', suggestedMax);
  }, [form.discountValue]);

  const setField = (field: keyof VoucherFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setField("code", randomCode);
  };

  const handleCopyCode = () => {
    const codeToCopy = form.code || "SUMMER2024";
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Mã voucher không được để trống";
    if (!form.discountValue || Number(form.discountValue) <= 0)
      errs.discountValue = "Giá trị giảm phải lớn hơn 0";
    if (form.discountType === "PERCENT" && (Number(form.discountValue) < 10 || Number(form.discountValue) > 50))
      errs.discountValue = "Phần trăm giảm phải nằm trong khoảng 10% - 50%";
    if (!form.startDate) errs.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!form.endDate) errs.endDate = "Vui lòng chọn ngày kết thúc";
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate))
      errs.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    if (form.usageLimit && Number(form.usageLimit) <= 0)
      errs.usageLimit = "Số lượt sử dụng phải lớn hơn 0";
    // Kiểm tra giá trị đơn hàng tối thiểu và tính hợp lý với % giảm
    if (form.minOrderValue) {
      const minVal = Number(form.minOrderValue);
      if (minVal < 50000) {
        errs.minOrderValue = "Đơn hàng tối thiểu phải ≥ 50.000đ";
      } else if (minVal > 5000000) {
        errs.minOrderValue = "Đơn hàng tối thiểu phải ≤ 5.000.000đ";
      } else if (form.discountValue) {
        const perc = Number(form.discountValue);
        let requiredMin = 0;
        if (perc <= 15) {
          requiredMin = 200000;
        } else if (perc <= 25) {
          requiredMin = 300000;
        } else {
          requiredMin = 500000;
        }
        if (minVal < requiredMin) {
          errs.minOrderValue = `Đơn hàng tối thiểu phải ≥ ${requiredMin.toLocaleString('vi-VN')}đ cho mức giảm ${perc}%`;
        }
      }
    }
    // Kiểm tra mức giảm tối đa so với phần trăm và đơn hàng tối thiểu
    if (form.maxDiscount && form.minOrderValue && form.discountValue) {
      const maxAllowed = (Number(form.minOrderValue) * Number(form.discountValue)) / 100;
      if (Number(form.maxDiscount) > maxAllowed) {
        errs.maxDiscount = `Mức giảm tối đa không được vượt quá ${maxAllowed.toLocaleString('vi-VN')}đ`;
      }
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!isLoggedIn()) {
      setServerError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 100,
        startDate: form.startDate,
        endDate: form.endDate,
        active: form.active,
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
      const url = isEdit
        ? `${API_URL}/api/vouchers/admin/${form.id}`
        : `${API_URL}/api/vouchers/admin`;
      const method = isEdit ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",

        },
        body: JSON.stringify(payload),
      });

      let errorMessage = "";
      try {
        const data = await res.json();
        if (!res.ok) {
          errorMessage = data.error || data.message || (isEdit ? "Cập nhật thất bại" : "Tạo voucher thất bại");
        } else {
          router.push("/admin/voucher");
          router.refresh();
          return;
        }
      } catch (parseErr) {
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }

      if (res.status === 401) {
        errorMessage = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
        localStorage.removeItem("adminToken");
        localStorage.removeItem("token");
      }
      throw new Error(errorMessage);
    } catch (err: any) {
      setServerError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Preview computations
  const formatMinOrder = () => {
    const val = Number(form.minOrderValue);
    if (!val) return "đơn hàng từ 0đ";
    if (val >= 1000) {
      return `đơn hàng từ ${(val / 1000).toLocaleString("vi-VN")}k`;
    }
    return `đơn hàng từ ${val.toLocaleString("vi-VN")}đ`;
  };

  const formatDiscountVal = () => {
    const val = Number(form.discountValue);
    if (!val) return "Giảm giá";
    if (form.discountType === "PERCENT") {
      return `Giảm ${val}%`;
    }
    return `Giảm ${val.toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-6 animate__animated animate__fadeIn font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">
            {isEdit ? "Chỉnh sửa Voucher" : "Thêm Voucher mới"}
          </h2>
          <nav className="flex items-center gap-1.5 text-xs text-[#5c403c] mt-1.5">
            <Link href="/admin/voucher" className="hover:text-[#b70011] transition-colors">Vouchers</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#b70011] font-bold">
              {isEdit ? "Cập nhật" : "Tạo mới"}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/voucher"
            className="px-5 py-2 border border-[#916f6b]/50 rounded-xl font-semibold text-xs text-[#5c403c] hover:bg-[#eceef0] transition-all cursor-pointer text-center"
          >
            Hủy
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-[#b70011] hover:bg-[#b70011]/90 text-white rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? "Lưu thay đổi" : "Lưu Voucher"}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 text-sm font-sans">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Grid Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: General Info */}
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e6bdb8]/10">
              <div className="p-2 bg-[#ffdad6] text-[#b70011] rounded-lg">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191c1e]">Thông tin chung</h3>
            </div>

            {/* Voucher Code */}
            <div>
              <label htmlFor="code" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Mã Voucher <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="code"
                  type="text"
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value.toUpperCase())}
                  placeholder="VD: SUMMER20"
                  maxLength={20}
                  className={`flex-1 bg-slate-50 border ${errors.code ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm font-bold tracking-widest focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="bg-[#e0e3e5] hover:bg-[#e6e8ea] px-4 py-2 rounded-xl text-[#b70011] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tạo mã
                </button>
              </div>
              {errors.code && <p className="mt-1 text-xs text-red-600 font-medium">{errors.code}</p>}
              <p className="mt-1.5 text-[11px] text-[#916f6b]">Mã tự động chuyển thành in hoa không dấu</p>
            </div>

            {/* Active Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-[#e6bdb8]/10 mt-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#191c1e]">Kích hoạt Voucher</span>
                <span className="text-[10px] text-[#916f6b]">Cho phép khách hàng sử dụng ngay sau khi tạo</span>
              </div>
              <label htmlFor="active" className="relative inline-flex items-center cursor-pointer">
                <input
                  id="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setField("active", e.target.checked)}
                  className="sr-only peer"
                  aria-label="Kích hoạt Voucher"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b70011]"></div>
              </label>
            </div>
          </div>

          {/* Card 2: Discount Config */}
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e6bdb8]/10">
              <div className="p-2 bg-[#ffdad6] text-[#b70011] rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191c1e]">Cấu hình giảm giá</h3>
            </div>

            {/* Đã loại bỏ lựa chọn Loại giảm giá, voucher luôn là PERCENT */}

            {/* Discount Value */}
            <div>
              <label htmlFor="discountValue" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Giá trị giảm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="discountValue"
                  type="number"
                  step="any"
                  value={form.discountValue}
                  onChange={(e) => setField("discountValue", e.target.value)}
                  placeholder={form.discountType === "PERCENT" ? "Ví dụ: 15 (15%)" : "Ví dụ: 50000"}
                  className={`w-full bg-slate-50 border ${errors.discountValue ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#916f6b]">
                  {form.discountType === "PERCENT" ? "%" : "VNĐ"}
                </span>
              </div>
              {errors.discountValue && <p className="mt-1 text-xs text-red-600 font-medium">{errors.discountValue}</p>}
            </div>

            {/* Max Discount (luôn hiển thị vì chỉ có loại giảm phần trăm) */}
            <div>
              <label htmlFor="maxDiscount" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Mức giảm tối đa (VNĐ)
              </label>
              <div className="relative">
                <input
                  id="maxDiscount"
                  type="number"
                  step="any"
                  value={form.maxDiscount ?? ""}
                  onChange={(e) => setField("maxDiscount", e.target.value)}
                  placeholder="Để trống nếu không giới hạn"
                  className="w-full bg-slate-50 border border-[#e6bdb8]/50 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#916f6b]">
                  VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Conditions */}
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e6bdb8]/10">
              <div className="p-2 bg-[#ffdad6] text-[#b70011] rounded-lg">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191c1e]">Điều kiện áp dụng</h3>
            </div>

            {/* Min Order Value */}
            <div>
              <label htmlFor="minOrderValue" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Đơn hàng tối thiểu (VNĐ)
              </label>
              <input
                id="minOrderValue"
                type="number"
                step="any"
                value={form.minOrderValue}
                onChange={(e) => setField("minOrderValue", e.target.value)}
                placeholder="0 = không yêu cầu tối thiểu"
                className="w-full bg-slate-50 border border-[#e6bdb8]/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20"
              />
              {errors.minOrderValue && <p className="mt-1 text-xs text-red-600 font-medium">{errors.minOrderValue}</p>}
            </div>

            {/* Total Usage Limit */}
            <div>
              <label htmlFor="usageLimit" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Số lượt sử dụng tối đa
              </label>
              <input
                id="usageLimit"
                type="number"
                value={form.usageLimit}
                onChange={(e) => setField("usageLimit", e.target.value)}
                placeholder="Mặc định: 100"
                className="w-full bg-slate-50 border border-[#e6bdb8]/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20"
              />
              {errors.usageLimit && <p className="mt-1 text-xs text-red-600 font-medium">{errors.usageLimit}</p>}
            </div>
          </div>

          {/* Card 4: Date Config */}
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e6bdb8]/10">
              <div className="p-2 bg-[#ffdad6] text-[#b70011] rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191c1e]">Thời gian áp dụng</h3>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className={`w-full bg-slate-50 border ${errors.startDate ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
              />
              {errors.startDate && <p className="mt-1 text-xs text-red-600 font-medium">{errors.startDate}</p>}
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                className={`w-full bg-slate-50 border ${errors.endDate ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
              />
              {errors.endDate && <p className="mt-1 text-xs text-red-600 font-medium">{errors.endDate}</p>}
            </div>
          </div>
        </div>

        {/* Real-time Atmospheric Ticket Preview */}
        <div className="mt-8 bg-gradient-to-r from-[#b70011] to-[#8a000d] p-8 rounded-2xl shadow-md text-white relative overflow-hidden group">
          {/* Subtle circles background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none transition-transform duration-1000 group-hover:scale-110">
            <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="circlePattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#circlePattern)" />
            </svg>
          </div>

          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-full mb-4">
              <div className="w-8 h-8 flex items-center justify-center font-bold text-lg border-2 border-white rounded-md">
                %
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-1">
              Xem trước thẻ Voucher
            </p>
            <h4 className="text-xl md:text-2xl font-bold leading-tight mb-3">
              {formatDiscountVal()} {formatMinOrder()}
            </h4>

            <div className="bg-white/20 px-6 py-2.5 rounded-lg inline-flex items-center gap-3 border border-white/30 backdrop-blur-sm">
              <span className="text-base font-bold tracking-widest font-mono">
                {form.code || "SUMMER2024"}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="hover:text-[#ffdad6] transition-colors focus:outline-none"
                title="Sao chép mã"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}