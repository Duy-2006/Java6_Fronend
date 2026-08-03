'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
                        alert("Không thể tải thông tin nhà xuất bản.");
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

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `${API_URL}/${id}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(true),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!");
                router.push('/admin/publishers');
            } else if (response.status === 401) {
                alert("Bạn không có quyền thực hiện hành động này!");
            } else {
                alert("Có lỗi xảy ra, vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi xử lý form:", error);
        }
    };



    if (loading) {
        return (
            <div className="bg-white border border-gray-250 rounded-xl p-6 shadow-sm text-center text-gray-500">
                Đang tải thông tin...
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Breadcrumb & Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="flex mb-2">
                        <ol className="inline-flex items-center space-x-1 md:space-x-2">
                            <li className="inline-flex items-center">
                                <Link className="text-xs font-semibold text-gray-500 hover:text-[#b70011] transition-colors text-decoration-none" href="/admin/dashboard">Dashboard</Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-sm text-gray-400 mr-1">chevron_right</span>
                                    <Link className="text-xs font-semibold text-gray-500 hover:text-[#b70011] transition-colors text-decoration-none" href="/admin/publishers">Publishers</Link>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-sm text-gray-400 mr-1">chevron_right</span>
                                    <span className="text-xs font-bold text-[#b70011]">{isEdit ? "Cập nhật" : "Thêm mới"}</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 font-sans">
                        {isEdit ? "Cập Nhật Nhà Xuất Bản" : "Thêm Nhà Xuất Bản Mới"}
                    </h1>
                </div>
            </div>

            {/* Form Container */}
            <div className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-base text-gray-800">Thông tin Nhà xuất bản</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Tên nhà xuất bản *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded-lg p-2.5 text-sm text-black bg-gray-50 focus:ring-2 focus:ring-[#b70011] focus:border-[#b70011] focus:bg-white outline-none transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-250'}`} 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInputChange} 
                                placeholder="Nhập tên NXB..."
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded-lg p-2.5 text-sm text-black bg-gray-50 focus:ring-2 focus:ring-[#b70011] focus:border-[#b70011] focus:bg-white outline-none transition-all ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-250'}`} 
                                name="address" 
                                value={formData.address} 
                                onChange={handleInputChange} 
                                placeholder="Nhập địa chỉ trụ sở..."
                            />
                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded-lg p-2.5 text-sm text-black bg-gray-50 focus:ring-2 focus:ring-[#b70011] focus:border-[#b70011] focus:bg-white outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-250'}`} 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleInputChange} 
                                placeholder="Nhập số điện thoại liên hệ..."
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái hoạt động</label>
                            <div className="flex items-center gap-2 pt-2.5">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="active" 
                                        checked={formData.active} 
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })} 
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ms-3 text-sm font-medium text-gray-700">{formData.active ? "Đang hoạt động" : "Ngưng hoạt động"}</span>
                                </label>
                            </div>
                        </div>
                    </div>



                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Link 
                            href="/admin/publishers"
                            className="px-5 py-2 rounded-lg border border-gray-250 text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95 bg-transparent text-decoration-none flex items-center justify-center" 
                        >
                            Hủy bỏ
                        </Link>
                        <button 
                            type="submit" 
                            className="px-5 py-2 rounded-lg bg-[#b70011] text-white text-sm font-bold shadow-sm hover:bg-[#93000b] transition-all active:scale-95 flex items-center gap-2 border-0"
                        >
                            <span className="material-symbols-outlined text-sm">check</span>
                            {isEdit ? "Cập nhật" : "Tạo Nhà xuất bản"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PublisherForm;
