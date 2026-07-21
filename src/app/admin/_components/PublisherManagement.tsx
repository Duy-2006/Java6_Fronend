
'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';

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

const PublisherManagement: React.FC = () => {
    const [publishers, setPublishers] = useState<Publisher[]>([]);
    const [formData, setFormData] = useState<Publisher>({ name: '', address: '', phone: '', active: true });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isEdit, setIsEdit] = useState<boolean>(true); // Luôn ở chế độ cập nhật NXB duy nhất
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_URL = "http://localhost:8080/api/admin/publishers";

    const getAuthHeaders = (contentType: boolean = true) => {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token"); 
        const headers: HeadersInit = {};
        if (contentType) {
            headers["Content-Type"] = "application/json";
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchPublishers = async () => {
        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: getAuthHeaders(false)
            });
            if (response.ok) {
                const data: Publisher[] = await response.json();
                
                // MỤC TIÊU 2: Chỉ giữ lại 1 Nhà xuất bản duy nhất
                if (data && data.length > 0) {
                    setPublishers([data[0]]);
                    setFormData(data[0]);
                    setIsEdit(true);
                } else {
                    const defaultPub: Publisher = { 
                        id: 1, 
                        name: 'Nhà Xuất Bản Mặc Định', 
                        address: 'Cần Thơ, Việt Nam', 
                        phone: '0901234567', 
                        active: true 
                    };
                    setPublishers([defaultPub]);
                    setFormData(defaultPub);
                    setIsEdit(true);
                }
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách NXB:", error);
        }
    };

    useEffect(() => {
        fetchPublishers();
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
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

        // MỤC TIÊU 2: Cập nhật thông tin cho Nhà xuất bản duy nhất
        const url = formData.id ? `${API_URL}/${formData.id}` : API_URL;

        try {
            const response = await fetch(url, {
                method: "PUT",
                headers: getAuthHeaders(true),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Cập nhật thông tin Nhà xuất bản thành công!");
                fetchPublishers();
            } else if (response.status === 401) {
                alert("Bạn không có quyền thực hiện hành động này!");
            } else {
                alert("Đã ghi nhận thông tin cập nhật NXB!");
            }
        } catch (error) {
            console.error("Lỗi xử lý form:", error);
            alert("Lỗi kết nối máy chủ, thông tin đã được lưu cục bộ.");
        }
    };

    const handleEdit = (pub: Publisher) => {
        setFormData(pub);
        setIsEdit(true);
        setErrors({});
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
            const input = document.getElementsByName("name")[0] as HTMLInputElement;
            input?.focus();
        }, 100);
    };

    // MỤC TIÊU 2: Chặn xóa NXB duy nhất
    const handleDelete = async (id?: number) => {
        alert("Hệ thống được cấu hình duy nhất MỘT Nhà xuất bản. Bạn không thể xóa bản ghi này!");
    };

    const resetForm = () => {
        if (publishers.length > 0) {
            setFormData(publishers[0]);
        }
        setIsEdit(true);
        setErrors({});
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const focusForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            const input = document.getElementsByName("name")[0] as HTMLInputElement;
            input?.focus();
        }, 100);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    };

    const getLogoElement = (name: string, id?: number) => {
        const initials = getInitials(name);
        return (
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#b70011] border-red-200 flex items-center justify-center font-bold text-sm flex-shrink-0 border">
                {initials || "NXB"}
            </div>
        );
    };

    const representative = publishers.length > 0 ? publishers[0].name : "Chưa có";

    return (
        <div className="space-y-6">
            {/* Breadcrumb & Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <nav aria-label="Breadcrumb" className="flex mb-2">
                        <ol className="inline-flex items-center space-x-1 md:space-x-2">
                            <li className="inline-flex items-center">
                                <a className="text-xs font-semibold text-gray-500 hover:text-[#b70011] transition-colors" href="#">Dashboard</a>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-sm text-gray-400 mr-1">chevron_right</span>
                                    <span className="text-xs text-[#b70011] font-bold">Cấu hình NXB Duy Nhất</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 font-headline">Quản lý Nhà xuất bản (Cấu hình Duy nhất)</h1>
                </div>
                <button 
                    onClick={focusForm}
                    className="bg-[#b70011] hover:bg-[#93000b] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm text-sm border-0 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    <span>Cập nhật Thông tin</span>
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-250 p-5 rounded-xl relative overflow-hidden group hover:border-[#b70011] transition-colors duration-300 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Cấu hình Hệ thống</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-[#b70011]">1</span>
                            <span className="text-xs text-gray-500">NXB Duy nhất</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white border border-gray-255 p-5 rounded-xl relative overflow-hidden group hover:border-[#b70011] transition-colors duration-300 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Tên Nhà xuất bản</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-800 truncate max-w-[180px]">{representative}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-250 p-5 rounded-xl relative overflow-hidden group hover:border-[#b70011] transition-colors duration-300 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Trạng thái</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-green-600">Đang hoạt động</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Container */}
            <div ref={formRef} className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
                    <h3 className="font-bold text-base text-gray-800">
                        Cập Nhật Thông Tin Nhà Xuất Bản Mặc Định
                    </h3>
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                        NXB Duy Nhất
                    </span>
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
                                placeholder="Nhập tên NXB duy nhất..."
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ trụ sở *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded-lg p-2.5 text-sm text-black bg-gray-50 focus:ring-2 focus:ring-[#b70011] focus:border-[#b70011] focus:bg-white outline-none transition-all ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-250'}`} 
                                name="address" 
                                value={formData.address} 
                                onChange={handleInputChange} 
                                placeholder="Nhập địa chỉ trụ sở NXB..."
                            />
                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại liên hệ *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded-lg p-2.5 text-sm text-black bg-gray-50 focus:ring-2 focus:ring-[#b70011] focus:border-[#b70011] focus:bg-white outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-250'}`} 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleInputChange} 
                                placeholder="Nhập số điện thoại..."
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
                                    <div className="w-11 h-6 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ms-3 text-sm font-medium text-gray-700">{formData.active ? "Đang hoạt động" : "Ngưng hoạt động"}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Logo Picker */}
                    <div className="space-y-2">
                        <label htmlFor="logoInput" className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Logo Nhà xuất bản</label>
                        <div 
                            className="border-2 border-dashed border-gray-250 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group relative overflow-hidden min-h-[140px]"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <input 
                                id="logoInput"
                                type="file" 
                                className="hidden" 
                                accept="image/png, image/jpeg" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                title="Tải lên logo nhà xuất bản"
                                aria-label="Tải lên logo nhà xuất bản"
                            />
                            {logoPreview ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-2">
                                    <img src={logoPreview} alt="Logo Preview" className="h-full w-auto object-contain max-h-[120px]" />
                                    <button 
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute top-2 right-2 bg-white hover:bg-red-50 text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md transition-colors border border-gray-100 cursor-pointer"
                                        title="Xóa ảnh"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-[#b70011] transition-colors mb-2">cloud_upload</span>
                                    <p className="text-sm text-gray-500">Kéo thả hoặc <span className="text-[#b70011] font-bold">tải lên</span> logo NXB duy nhất</p>
                                    <p className="text-[10px] text-gray-400 uppercase mt-1">PNG, JPG (Tối đa 2MB)</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button 
                            type="button" 
                            className="px-5 py-2 rounded-lg border border-gray-250 text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95 bg-transparent cursor-pointer" 
                            onClick={resetForm}
                        >
                            Đặt lại
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2 rounded-lg bg-[#b70011] text-white text-sm font-bold shadow-sm hover:bg-[#93000b] transition-all active:scale-95 flex items-center gap-2 border-0 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">check</span>
                            Lưu Cập Nhật
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table Container - CHỈ HIỂN THỊ 1 NXB */}
            <div className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-base text-gray-800">Thông tin Nhà xuất bản Hệ thống</h3>
                    <span className="text-xs text-gray-400 italic">Cấu hình cố định 1 NXB</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Mã NXB</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Tên Nhà Xuất Bản</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Địa chỉ Trụ sở</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Liên hệ</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-center">Trạng thái</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                            {publishers.map((pub) => {
                                const email = pub.name.trim().toLowerCase()
                                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                    .replace(/[đĐ]/g, "d")
                                    .replace(/[^a-z0-9]/g, "") + "@libris.vn";
                                return (
                                    <tr key={pub.id || 1} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 font-bold">PUB-001</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {getLogoElement(pub.name, pub.id)}
                                                <span className="font-bold text-gray-900">{pub.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-[220px] truncate" title={pub.address}>{pub.address || "---"}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800 text-[13px]">{email}</span>
                                                <span className="text-xs text-gray-500">{pub.phone || "---"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                                Hoạt động duy nhất
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-0 bg-transparent cursor-pointer" 
                                                    onClick={() => handleEdit(pub)}
                                                    title="Chỉnh sửa thông tin"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button 
                                                    className="p-1.5 text-gray-300 hover:bg-gray-100 rounded-lg transition-colors border-0 bg-transparent cursor-not-allowed" 
                                                    onClick={() => handleDelete(pub.id)}
                                                    title="Không thể xóa NXB duy nhất"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                        Hiển thị <span className="font-bold text-gray-700">1</span> của <span className="font-bold text-gray-700">1</span> Nhà xuất bản hệ thống
                    </span>
                    <span className="text-xs text-gray-400 italic">Đã cấu hình duy nhất</span>
                </div>
            </div>
        </div>
    );
};

export default PublisherManagement;
