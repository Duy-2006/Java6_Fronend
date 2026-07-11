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
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_URL = "http://localhost:8080/api/admin/publishers";

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

    const fetchPublishers = async () => {
        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: getAuthHeaders(false)
            });
            if (response.ok) {
                const data: Publisher[] = await response.json();
                setPublishers(data);
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
        
        // Xóa lỗi của ô đó ngay khi người dùng bắt đầu gõ lại
        if (errors[name as keyof FormErrors]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    // Hàm validate kiểm tra dữ liệu trước khi submit
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        // Regex check sđt linh hoạt hơn: cho phép 9-11 số, có thể chứa dấu +, khoảng trắng hoặc dấu gạch ngang (VD: bàn, di động)
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
        return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi nào
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Nếu validate thất bại thì dừng lại luôn, không cho gọi API
        if (!validateForm()) return;

        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `${API_URL}/${formData.id}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(true),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!");
                resetForm();
                fetchPublishers();
            } else if (response.status === 401) {
                alert("Bạn không có quyền thực hiện hành động này!");
            }
        } catch (error) {
            console.error("Lỗi xử lý form:", error);
        }
    };

    const handleEdit = (pub: Publisher) => {
        setFormData(pub);
        setIsEdit(true);
        setErrors({}); // Xóa các thông báo lỗi cũ nếu đang có
        // Scroll to form and focus name
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
            const input = document.getElementsByName("name")[0] as HTMLInputElement;
            input?.focus();
        }, 100);
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (window.confirm("Bạn có chắc chắn muốn xóa nhà xuất bản này?")) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { 
                    method: "DELETE",
                    headers: getAuthHeaders(false)
                });
                if (response.ok) {
                    alert("Xóa thành công!");
                    fetchPublishers();
                }
            } catch (error) {
                console.error("Lỗi xóa NXB:", error);
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', address: '', phone: '', active: true });
        setIsEdit(false);
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

    // Helper functions for design
    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
    };

    const getLogoUrl = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("kim đồng")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBlMvtmcx_bdjPg9X3A90AB0BZ76ZF8g1LptZx8kiuJ5UbuF-vFLtdM8ouKYk-EUUTtuAttWgOp9wycHl1NjrrfUyoFxxmE4FRkVHiIcZl-2nEtls59Ners37KYAXakHxciuPSuX4gimy629G0vBYQe5W4mLe9DdKrexXwZDsUOnSRif_s1SV7-Ci_ovxTG_RkTuS7nFnaef7h4L-EdIX6a-iOqBGrIlQ0fqMM5rl-A7GeABRZJcJMusfOA54KJxIkJrtaL62D6Rw4";
        if (n.includes("trẻ")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuAAZNKJ5hVdQZyQwfynkic-394N9UqYEFuo2tFEWV9FdNSZStLAdhq5PAiHfoQ1Yl15_nVmLqTl8dRQG-MRigQkSqytgcHr84ZROGQt0puu8WSh7jHHtAedetGZGFpHfH5YrZgva-jGD90zdkAASwIkbU-418gXIxd48m2ZniIhDXSzfPRI1sP9rMYBpg466eQ_N6dNLHkFgNES3xjbvK7Hg5ndFtyyMnGn3vn_vG5an5Ymlfm-MCI3ihHU_Je3e3Qeu6B3QvC--HQ";
        if (n.includes("nhã nam")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBlD17NckFhKQkF_v7fcohGfO-9Ikj10z2sAWcX6_scmdDfYPGh-nYFH-zG1zKFE0GNSovd5SkJHa1MGyhvXq03BN96BbWAt4ZKb_8P7C7AKSoOm2t7cgq9UC8m2Diw06fG0i78DXez0AyugdJ7w6a781SwE5krbJV_crJ3fCd3DGzHMKUgzkEfwyh_7TokSkE-T1bZ1KiGVCP6UALVtAgxKWcoRnTZ2bXPN6evaUsZJmYVGaYCrr_gTL31Ce9djHsUVdaxrczMaTs";
        if (n.includes("giáo dục")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBfv8Obnub_gM7D1oPv2kGodVZC5_1p90mAWEkmR2dxJZl_ZkPwZJxWBw9KhNq2rH7WtNoP_4X4fqBedGqKOubpB2lQHSUuMQH1-qCCT2tnD_Tt_MAfbcR4HqSTzhY8s41DE1QprkR2nbIy6udrUS3RpCGRrkueWc3SzBks7Adt5adyCT1tMIoVRuKWcVcF-61N4LUvlzEnSo2GRF1WkgfRs6nldEngKnDg2xhwu1RhhoH_jJ6N60XhUVbIVf__Re6rW76pVDkrDXk";
        return "";
    };

    const getLogoElement = (name: string, id?: number) => {
        const url = getLogoUrl(name);
        if (url) {
            return <img className="w-10 h-10 rounded-full bg-gray-150 flex-shrink-0 object-cover border border-gray-100" src={url} alt={name} />;
        }
        const initials = getInitials(name);
        const bgColors = [
            "bg-red-50 text-red-600 border-red-200",
            "bg-blue-50 text-blue-600 border-blue-200",
            "bg-green-50 text-green-600 border-green-200",
            "bg-purple-50 text-purple-600 border-purple-200",
            "bg-amber-50 text-amber-600 border-amber-200",
            "bg-indigo-50 text-indigo-600 border-indigo-200"
        ];
        const colorClass = bgColors[(id || 0) % bgColors.length];
        return (
            <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center font-bold text-sm flex-shrink-0 border`}>
                {initials || "NXB"}
            </div>
        );
    };

    const activeCount = publishers.filter(p => p.active).length;
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
                                    <span className="text-xs font-semibold text-[#b70011] font-bold">Publishers</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 font-headline">Quản lý Nhà xuất bản</h1>
                </div>
                <button 
                    onClick={focusForm}
                    className="bg-[#b70011] hover:bg-[#93000b] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm text-sm border-0"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>Thêm Nhà xuất bản</span>
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-250 p-5 rounded-xl relative overflow-hidden group hover:border-[#b70011] transition-colors duration-300 shadow-sm">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Tổng số NXB</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-[#b70011]">{publishers.length}</span>
                            <span className="text-xs text-gray-500">đơn vị</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined absolute right-5 bottom-5 text-[#b70011]/10 text-4xl">business</span>
                </div>
                
                <div className="bg-white border border-gray-255 p-5 rounded-xl relative overflow-hidden group hover:border-[#b70011] transition-colors duration-300 shadow-sm">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">NXB Tiêu Biểu</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-800 truncate max-w-[180px]">{representative}</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined absolute right-5 bottom-5 text-blue-500/10 text-4xl">stars</span>
                </div>

                <div className="bg-white border border-gray-250 p-5 rounded-xl relative overflow-hidden group hover:border-[#b70011] transition-colors duration-300 shadow-sm">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Hợp đồng hiệu lực</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-green-600">{activeCount}</span>
                            <span className="text-xs text-gray-500">đối tác</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined absolute right-5 bottom-5 text-green-500/10 text-4xl">description</span>
                </div>
            </div>

            {/* Form Container */}
            <div ref={formRef} className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-base text-gray-800">
                        {isEdit ? "Cập Nhật Nhà Xuất Bản" : "Thêm Nhà Xuất Bản Mới"}
                    </h3>
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
                                        className="absolute top-2 right-2 bg-white hover:bg-red-50 text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md transition-colors border border-gray-100"
                                        title="Xóa ảnh"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-[#b70011] transition-colors mb-2">cloud_upload</span>
                                    <p className="text-sm text-gray-500">Kéo thả hoặc <span className="text-[#b70011] font-bold">tải lên</span> logo</p>
                                    <p className="text-[10px] text-gray-400 uppercase mt-1">PNG, JPG (Tối đa 2MB)</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button 
                            type="button" 
                            className="px-5 py-2 rounded-lg border border-gray-250 text-sm text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-95 bg-transparent" 
                            onClick={resetForm}
                        >
                            Hủy bỏ
                        </button>
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

            {/* List Table Container */}
            <div className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-base text-gray-800">Danh sách Nhà xuất bản</h3>
                    <div className="flex gap-2">
                        <button className="p-2 border border-gray-250 rounded-lg hover:bg-gray-50 transition-colors bg-transparent" title="Bộ lọc">
                            <span className="material-symbols-outlined text-gray-500 text-lg">filter_list</span>
                        </button>
                        <button className="p-2 border border-gray-250 rounded-lg hover:bg-gray-50 transition-colors bg-transparent" title="Xuất dữ liệu">
                            <span className="material-symbols-outlined text-gray-500 text-lg">download</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Nhà xuất bản</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Địa chỉ</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Liên hệ</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-center">Trạng thái</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                            {publishers.map((pub) => {
                                const email = pub.name.trim().toLowerCase()
                                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accent tones
                                    .replace(/[đĐ]/g, "d")
                                    .replace(/[^a-z0-9]/g, "") + "@gmail.com";
                                return (
                                    <tr key={pub.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">PUB-{String(pub.id).padStart(3, '0')}</td>
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
                                            {pub.active ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                                    Hoạt động
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                                                    Ngưng hoạt động
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-0 bg-transparent" 
                                                    onClick={() => handleEdit(pub)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button 
                                                    className="p-1.5 text-[#b70011] hover:bg-red-50 rounded-lg transition-colors border-0 bg-transparent" 
                                                    onClick={() => handleDelete(pub.id)}
                                                    title="Xóa"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {publishers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">Chưa có dữ liệu nhà xuất bản.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-xs text-gray-500">
                        Hiển thị <span className="font-bold text-gray-700">1 - {publishers.length}</span> của <span className="font-bold text-gray-700">{publishers.length}</span> nhà xuất bản
                    </span>
                    <div className="flex items-center gap-1">
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 bg-transparent" disabled>
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#b70011] text-white text-xs font-bold shadow-sm border-0">1</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 bg-transparent" disabled>
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublisherManagement;