'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Publisher {
    id?: number;
    name: string;
    address: string;
    phone: string;
    active: boolean;
}

const PublisherList: React.FC = () => {
    const router = useRouter();
    const [publishers, setPublishers] = useState<Publisher[]>([]);
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');

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

    const fetchPublishers = async () => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/admin/books`, {
                method: "GET",
                headers: getAuthHeaders(false)
            });
            if (response.ok) {
                const data = await response.json();
                setBooks(data);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách sách:", error);
        }
    };

    useEffect(() => {
        fetchPublishers();
        fetchBooks();
    }, []);

    const handleDelete = async (id?: number) => {
        if (!id) return;
        const pubToUpdate = publishers.find(p => p.id === id);
        if (!pubToUpdate) return;

        const isCurrentlyActive = pubToUpdate.active;
        const message = isCurrentlyActive
            ? `Bạn có chắc chắn muốn ngưng hoạt động nhà xuất bản "${pubToUpdate.name}"?`
            : `Bạn có chắc chắn muốn kích hoạt hoạt động lại nhà xuất bản "${pubToUpdate.name}"?`;

        if (window.confirm(message)) {
            try {
                const updatedData = {
                    name: pubToUpdate.name,
                    address: pubToUpdate.address || "",
                    phone: pubToUpdate.phone || "",
                    active: !isCurrentlyActive
                };
                
                const response = await fetch(`${API_URL}/${id}`, { 
                    method: "PUT",
                    headers: {
                        ...getAuthHeaders(true),
                    },
                    body: JSON.stringify(updatedData)
                });
                
                if (response.ok) {
                    alert(isCurrentlyActive ? "Đã ngưng hoạt động nhà xuất bản thành công!" : "Đã kích hoạt hoạt động nhà xuất bản thành công!");
                    fetchPublishers();
                } else if (response.status === 401) {
                    alert("Bạn không có quyền thực hiện hành động này!");
                } else {
                    alert("Cập nhật trạng thái thất bại.");
                }
            } catch (error) {
                console.error("Lỗi cập nhật trạng thái NXB:", error);
            }
        }
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

    const filteredPublishers = publishers.filter(pub => 
        pub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pub.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pub.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = publishers.filter(p => p.active).length;
    const representative = publishers.length > 0 ? publishers[0].name : "Chưa có";

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
                                    <span className="text-xs font-bold text-[#b70011]">Publishers</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 font-sans">Quản lý Nhà xuất bản</h1>
                </div>
                <Link 
                    href="/admin/publishers/new"
                    className="bg-[#b70011] hover:bg-[#93000b] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm text-sm border-0 text-decoration-none"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>Thêm Nhà xuất bản</span>
                </Link>
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

            {/* List Table Container */}
            <div className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                    <h3 className="font-bold text-base text-gray-800">Danh sách Nhà xuất bản</h3>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Search Input */}
                        <div style={{ position: "relative" }} className="w-full sm:w-64">
                            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} className="material-symbols-outlined text-gray-400 text-lg">search</span>
                            <input
                                type="search"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Tìm kiếm nhà xuất bản..."
                                className="w-full bg-[#f2f4f6]/80 border border-gray-200 rounded-lg py-2 pr-4 text-xs focus:bg-white focus:ring-1 focus:ring-[#b70011] transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
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
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider w-[120px]" style={{ textAlign: "center" }}>Mã NXB</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Nhà xuất bản</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider" style={{ textAlign: "center" }}>Số điện thoại</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider" style={{ textAlign: "center" }}>Số đầu sách</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider" style={{ textAlign: "center" }}>Trạng thái</th>
                                <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider" style={{ textAlign: "center" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">Đang tải danh sách nhà xuất bản...</td>
                                </tr>
                            ) : filteredPublishers.map((pub) => {
                                const bookCount = books.filter(b => (b.publisherIds && b.publisherIds.includes(pub.id)) || (b.publisher === pub.name)).length;
                                return (
                                    <tr 
                                        key={pub.id} 
                                        onClick={() => router.push(`/admin/publishers/${pub.id}`)}
                                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500" style={{ textAlign: "center" }}>PUB-{String(pub.id).padStart(3, '0')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {getLogoElement(pub.name, pub.id)}
                                                <span className="font-bold text-gray-900">{pub.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500" style={{ textAlign: "center" }}>
                                            {pub.phone || "---"}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-700" style={{ textAlign: "center" }}>
                                            {bookCount} tác phẩm
                                        </td>
                                        <td className="px-6 py-4" style={{ textAlign: "center" }}>
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
                                        <td className="px-6 py-4" style={{ textAlign: "center" }}>
                                            <div className="flex justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <Link 
                                                    href={`/admin/publishers/${pub.id}/edit`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-0 bg-transparent flex items-center justify-center text-decoration-none" 
                                                    title="Chỉnh sửa"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </Link>
                                                <button 
                                                    className={`p-1.5 rounded-lg transition-colors border-0 bg-transparent flex items-center justify-center ${
                                                        pub.active 
                                                            ? "text-[#b70011] hover:bg-red-50" 
                                                            : "text-green-600 hover:bg-green-50"
                                                    }`} 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(pub.id);
                                                    }}
                                                    title={pub.active ? "Ngưng hoạt động" : "Kích hoạt lại"}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {pub.active ? "block" : "check_circle"}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filteredPublishers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        {searchQuery ? `Không tìm thấy nhà xuất bản nào khớp với "${searchQuery}"` : "Chưa có dữ liệu nhà xuất bản."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-xs text-gray-500">
                        Hiển thị <span className="font-bold text-gray-700">1 - {filteredPublishers.length}</span> của <span className="font-bold text-gray-700">{filteredPublishers.length}</span> nhà xuất bản
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

export default PublisherList;
