"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  // Sửa lỗi TypeScript: không gán undefined vào Record<string, string>
  const setField = (field: keyof VoucherFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Xóa lỗi của field đó khỏi errors object
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Mã voucher không được để trống";
    if (!form.discountValue || Number(form.discountValue) <= 0)
      errs.discountValue = "Giá trị giảm phải lớn hơn 0";
    if (form.discountType === "PERCENT" && Number(form.discountValue) > 100)
      errs.discountValue = "Phần trăm giảm không được vượt quá 100";
    if (!form.startDate) errs.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!form.endDate) errs.endDate = "Vui lòng chọn ngày kết thúc";
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate))
      errs.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    if (form.usageLimit && Number(form.usageLimit) <= 0)
      errs.usageLimit = "Số lượt sử dụng phải lớn hơn 0";
    if (form.minOrderValue && Number(form.minOrderValue) < 0)
      errs.minOrderValue = "Đơn hàng tối thiểu không được âm";
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

    // Lấy token từ nhiều nguồn khả dĩ
    let token = localStorage.getItem("adminToken");
    if (!token) token = localStorage.getItem("token");
    if (!token) token = sessionStorage.getItem("adminToken");
    if (!token) token = sessionStorage.getItem("token");

    // Log để kiểm tra
    console.log("🔑 Token retrieved:", token ? "Có token (dài " + token.length + ")" : "KHÔNG có token");

    if (!token) {
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

      const url = isEdit
        ? `http://localhost:8080/api/vouchers/admin/${form.id}`
        : "http://localhost:8080/api/vouchers/admin";
      const method = isEdit ? "PUT" : "POST";

      console.log(`📡 Gửi request ${method} đến: ${url}`);
      console.log("📦 Payload:", payload);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", res.status);

      let errorMessage = "";
      try {
        const data = await res.json();
        if (!res.ok) {
          errorMessage = data.error || data.message || (isEdit ? "Cập nhật thất bại" : "Tạo voucher thất bại");
        } else {
          // Thành công
          router.push("/admin/voucher");
          router.refresh();
          return;
        }
      } catch (parseErr) {
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }

      if (res.status === 401) {
        errorMessage = "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
        // Xóa token cũ
        localStorage.removeItem("adminToken");
        localStorage.removeItem("token");
        // Có thể redirect về login
        // router.push("/admin/login");
      }
      throw new Error(errorMessage);
    } catch (err: any) {
      console.error("❌ Lỗi khi gọi API:", err);
      setServerError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        /* ... giữ nguyên style như cũ ... */
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .voucher-wrapper {
          display: flex;
          justify-content: center;
          margin-top: 32px;
          padding: 0 16px 32px;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .voucher-card {
          max-width: 680px;
          width: 100%;
          background: #fff;
          padding: 32px 28px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          border: 1px solid #f0f0f0;
        }
        .voucher-card h3 {
          text-align: center;
          margin: 0 0 28px;
          font-size: 19px;
          font-weight: 700;
          color: #111827;
        }
        .vf-group {
          margin-bottom: 16px;
        }
        .vf-label {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          display: block;
          color: #374151;
        }
        .vf-input, .vf-select {
          width: 100%;
          padding: 10px 13px;
          border-radius: 9px;
          border: 1.5px solid #e5e7eb;
          font-size: 14px;
          color: #111827;
          background: #fafafa;
          transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .vf-input:focus, .vf-select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
          background: #fff;
        }
        .vf-input.error, .vf-select.error {
          border-color: #c0392b !important;
        }
        .vf-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .vf-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
        }
        .vf-date-row {
          display: flex;
          gap: 12px;
        }
        .vf-date-row .vf-group {
          flex: 1;
        }
        .vf-submit {
          width: 100%;
          margin-top: 20px;
          padding: 13px;
          background: linear-gradient(135deg, #6366f1, #22c55e);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity .2s;
        }
        .vf-submit:hover {
          opacity: .92;
        }
        .vf-submit:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
        .vf-cancel {
          display: block;
          width: 100%;
          margin-top: 10px;
          padding: 11px;
          background: #f3f4f6;
          border: none;
          border-radius: 10px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: background .2s;
          font-family: inherit;
        }
        .vf-cancel:hover {
          background: #e5e7eb;
          color: #374151;
        }
        .vf-error-box {
          background: #fee2e2;
          color: #991b1b;
          padding: 10px 14px;
          border-radius: 9px;
          font-size: 13px;
          margin-bottom: 14px;
          border: 1px solid #fca5a5;
        }
        .field-error {
          color: #c0392b;
          font-size: 12px;
          margin-top: 4px;
        }
        .vf-note {
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 12px;
          line-height: 1.5;
        }
        .inline-hint {
          font-size: 11px;
          color: #6c757d;
          margin-top: 2px;
        }
      `}</style>

      <div className="voucher-wrapper">
        <div className="voucher-card">
          <h3>{isEdit ? "✏️ Chỉnh sửa voucher" : "➕ Thêm voucher mới"}</h3>

          {serverError && (
            <div className="vf-error-box">⚠️ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="vf-group">
              <label className="vf-label">Mã voucher <span style={{ color: "#c0392b" }}>*</span></label>
              <input
                className={`vf-input ${errors.code ? "error" : ""}`}
                type="text"
                value={form.code}
                onChange={(e) => setField("code", e.target.value)}
                placeholder="VD: SUMMER20"
                maxLength={20}
              />
              {errors.code && <div className="field-error">{errors.code}</div>}
              <div className="inline-hint">Sẽ tự động chuyển thành chữ hoa, không dấu</div>
            </div>

            <div className="vf-group">
              <label className="vf-label">Loại giảm giá</label>
              <select
                className="vf-select"
                value={form.discountType}
                onChange={(e) => setField("discountType", e.target.value as any)}
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div className="vf-group">
              <label className="vf-label">Giá trị giảm <span style={{ color: "#c0392b" }}>*</span></label>
              <input
                className={`vf-input ${errors.discountValue ? "error" : ""}`}
                type="number"
                step="any"
                value={form.discountValue}
                onChange={(e) => setField("discountValue", e.target.value)}
                placeholder={form.discountType === "PERCENT" ? "VD: 10 (10%)" : "VD: 50000"}
              />
              {errors.discountValue && <div className="field-error">{errors.discountValue}</div>}
            </div>

            <div className="vf-group">
              <label className="vf-label">Đơn hàng tối thiểu (VNĐ)</label>
              <input
                className={`vf-input ${errors.minOrderValue ? "error" : ""}`}
                type="number"
                step="any"
                value={form.minOrderValue}
                onChange={(e) => setField("minOrderValue", e.target.value)}
                placeholder="0 = không yêu cầu"
              />
              {errors.minOrderValue && <div className="field-error">{errors.minOrderValue}</div>}
            </div>

            {form.discountType === "PERCENT" && (
              <div className="vf-group">
                <label className="vf-label">Giảm tối đa (VNĐ)</label>
                <input
                  className={`vf-input ${errors.maxDiscount ? "error" : ""}`}
                  type="number"
                  step="any"
                  value={form.maxDiscount ?? ""}
                  onChange={(e) => setField("maxDiscount", e.target.value)}
                  placeholder="Để trống nếu không giới hạn"
                />
                <div className="inline-hint">Chỉ áp dụng khi giảm theo phần trăm</div>
              </div>
            )}

            <div className="vf-group">
              <label className="vf-label">Số lượt sử dụng tối đa</label>
              <input
                className={`vf-input ${errors.usageLimit ? "error" : ""}`}
                type="number"
                value={form.usageLimit}
                onChange={(e) => setField("usageLimit", e.target.value)}
                placeholder="Mặc định: 100"
              />
              {errors.usageLimit && <div className="field-error">{errors.usageLimit}</div>}
            </div>

            <div className="vf-date-row">
              <div className="vf-group">
                <label className="vf-label">Ngày bắt đầu <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  className={`vf-input ${errors.startDate ? "error" : ""}`}
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                />
                {errors.startDate && <div className="field-error">{errors.startDate}</div>}
              </div>
              <div className="vf-group">
                <label className="vf-label">Ngày kết thúc <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  className={`vf-input ${errors.endDate ? "error" : ""}`}
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
                {errors.endDate && <div className="field-error">{errors.endDate}</div>}
              </div>
            </div>

            <div className="vf-checkbox">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setField("active", e.target.checked)}
                id="active"
              />
              <label htmlFor="active" className="vf-label" style={{ marginBottom: 0 }}>Kích hoạt</label>
            </div>

            <button type="submit" className="vf-submit" disabled={loading}>
              {loading ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Tạo voucher"}
            </button>
            <Link href="/admin/voucher" className="vf-cancel">Hủy</Link>
            <p className="vf-note">
              Voucher sau khi tạo có thể được quản lý, chỉnh sửa hoặc vô hiệu hóa trong danh sách.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}