'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

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
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/; // Regex check sđt Việt Nam hợp lệ

        if (!formData.name.trim()) {
            newErrors.name = "Vui lòng nhập tên nhà xuất bản.";
        }
        if (!formData.address.trim()) {
            newErrors.address = "Vui lòng nhập địa chỉ.";
        }
        if (!formData.phone.trim()) {
            newErrors.phone = "Vui lòng nhập số điện thoại.";
        } else if (!phoneRegex.test(formData.phone.trim())) {
            newErrors.phone = "Số điện thoại không đúng định dạng (VD: 0987654321).";
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
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Quản Lý Nhà Xuất Bản</h2>
            <hr className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 h-fit">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700">
                        {isEdit ? "Cập Nhật Nhà Xuất Bản" : "Thêm Nhà Xuất Bản"}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhà xuất bản *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded p-2 text-black ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInputChange} 
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded p-2 text-black ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                                name="address" 
                                value={formData.address} 
                                onChange={handleInputChange} 
                            />
                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                            <input 
                                type="text" 
                                className={`w-full border rounded p-2 text-black ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleInputChange} 
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium">
                                {isEdit ? "Cập nhật" : "Thêm mới"}
                            </button>
                            {isEdit && (
                                <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition" onClick={resetForm}>
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="md:col-span-2 overflow-x-auto">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700">Danh Sách Nhà Xuất Bản</h4>
                    <table className="min-w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-black">
                                <th className="border p-2 text-left">ID</th>
                                <th className="border p-2 text-left">Tên</th>
                                <th className="border p-2 text-left">Địa Chỉ</th>
                                <th className="border p-2 text-left">Điện Thoại</th>
                                <th className="border p-2 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-black">
                            {publishers.map((pub) => (
                                <tr key={pub.id} className="hover:bg-gray-50">
                                    <td className="border p-2">{pub.id}</td>
                                    <td className="border p-2 font-medium">{pub.name}</td>
                                    <td className="border p-2">{pub.address || "---"}</td>
                                    <td className="border p-2">{pub.phone || "---"}</td>
                                    <td className="border p-2 text-center space-x-2">
                                        <button className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600" onClick={() => handleEdit(pub)}>Sửa</button>
                                        <button className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600" onClick={() => handleDelete(pub.id)}>Xóa</button>
                                    </td>
                                </tr>
                            ))}
                            {publishers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-4 text-gray-500">Chưa có dữ liệu nhà xuất bản.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PublisherManagement;