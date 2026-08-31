'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  Phone,
  ChevronRight,
  Edit,
  Building
} from "lucide-react";

interface Publisher {
  id?: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
}

interface FormErrors {
  name?: string;
  address?: string;
  phone?: string;
}

interface PublisherFormProps {
  id?: number; // Pass id if editing
}

const PublisherForm: React.FC<PublisherFormProps> = ({ id }) => {
  const router = useRouter();
  const isEdit = id !== undefined;
  const [formData, setFormData] = useState<Publisher>({ name: '', address: '', phone: '', active: true });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
  const API_URL = `${BASE_URL}/api/admin/publishers`;

  const getAuthHeaders = (contentType: boolean = true) => {
    const token = localStorage.getItem("token"); 
    const headers: HeadersInit = {};
    if (contentType) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch existing publisher data if in edit mode
  useEffect(() => {
    if (isEdit && id) {
      const fetchPublisher = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_URL}/${id}`, {
            method: "GET",
            headers: getAuthHeaders(false)
          });
          if (response.ok) {
            const data: Publisher = await response.json();
            setFormData(data);
          } else {
            toast({
              title: "Lỗi",
              description: "Không thể tải thông tin nhà xuất bản.",
              variant: "destructive"
            });
            router.push('/admin/publishers');
          }
        } catch (error) {
          console.error("Lỗi lấy thông tin NXB:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPublisher();
    }
  }, [id, isEdit]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const phoneRegex = /^[0-9\-\+\s]{9,15}$/; 

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên nhà xuất bản.";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = "Số điện thoại không hợp lệ (từ 9 - 15 ký tự số).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${API_URL}/${id}` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(true),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!",
        });
        router.push('/admin/publishers');
      } else if (response.status === 401) {
        toast({
          title: "Lỗi",
          description: "Bạn không có quyền thực hiện hành động này!",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra, vui lòng thử lại.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Lỗi xử lý form:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white border border-slate-100 rounded-xl shadow-sm text-center text-slate-500 font-medium">
        Đang tải thông tin nhà xuất bản...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 animate__animated animate__fadeIn font-sans">
      {/* Header */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-[#191c1e] font-sans">
          {isEdit ? "Cập Nhật Nhà Xuất Bản" : "Thêm Nhà Xuất Bản Mới"}
        </h2>
      </section>

      {/* Main Form Card */}
      <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
        {/* Header Block with linear gradient */}
        <div className="bg-gradient-to-r from-[#b70011] to-[#bf0715] p-5 text-white flex items-center gap-2.5">
          {isEdit ? (
            <Edit className="w-5.5 h-5.5" />
          ) : (
            <Building2 className="w-5.5 h-5.5" />
          )}
          <h3 className="font-bold text-sm uppercase tracking-wide">
            {isEdit ? `Chỉnh sửa: ${formData.name}` : "Thông tin nhà xuất bản"}
          </h3>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-white space-y-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Input Tên Nhà Xuất Bản */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Tên Nhà Xuất Bản <span className="text-red-500">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Building className="w-4.5 h-4.5 text-slate-400" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  name="name"
                  style={{ paddingLeft: "2.5rem" }}
                  className={`w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none ${
                    errors.name ? "ring-2 ring-red-500" : ""
                  }`}
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên nhà xuất bản (VD: NXB Trẻ, NXB Kim Đồng)..."
                  maxLength={100}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold px-0.5">
                <span>Nhập tên hiển thị chính thức của nhà xuất bản</span>
                <span>{formData.name.length}/100</span>
              </div>
            </div>

            {/* Input Địa Chỉ */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Địa Chỉ Trụ Sở <span className="text-red-500">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <MapPin className="w-4.5 h-4.5 text-slate-400" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  name="address"
                  style={{ paddingLeft: "2.5rem" }}
                  className={`w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none ${
                    errors.address ? "ring-2 ring-red-500" : ""
                  }`}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ trụ sở chính..."
                  disabled={loading}
                />
              </div>
              {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>}
              <p className="text-[11px] text-slate-400 font-semibold px-0.5">
                Địa chỉ đăng ký kinh doanh hoặc văn phòng đại diện chính.
              </p>
            </div>

            {/* Input Số Điện Thoại */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Số Điện Thoại Liên Hệ <span className="text-red-500">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Phone className="w-4.5 h-4.5 text-slate-400" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  name="phone"
                  style={{ paddingLeft: "2.5rem" }}
                  className={`w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2.5 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none ${
                    errors.phone ? "ring-2 ring-red-500" : ""
                  }`}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại liên hệ (VD: 02838225340)..."
                  disabled={loading}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
              <p className="text-[11px] text-slate-400 font-semibold px-0.5">
                Số điện thoại liên hệ làm việc hoặc hotline hỗ trợ.
              </p>
            </div>

            {/* Toggle Switch Trạng Thái Hoạt Động */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700">
                Trạng Thái Hoạt Động
              </label>
              <div className="flex items-center gap-3 pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b70011]"></div>
                  <span className="ms-3 text-xs font-semibold text-slate-700">
                    {formData.active ? "Đang hoạt động" : "Ngưng hoạt động"}
                  </span>
                </label>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/admin/publishers"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-decoration-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#b70011] text-white hover:bg-[#b70011]/90 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#b70011]/15 transition-all cursor-pointer border-0"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu NXB"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublisherForm;

