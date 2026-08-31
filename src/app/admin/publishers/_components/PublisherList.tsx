'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmModal from "@/app/admin/_components/ConfirmModal";
import { useToast } from "@/components/ui/use-toast";
import { Edit, Eye, EyeOff, Search, Download, Grid, List, Plus } from "lucide-react";

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
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [confirmId, setConfirmId] = useState<number | null>(null);
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

    const handleToggleConfirmClick = (id: number) => {
        setConfirmId(id);
    };

    const handleConfirmToggle = async () => {
        if (!confirmId) return;
        const pubToUpdate = publishers.find(p => p.id === confirmId);
        if (!pubToUpdate) {
            setConfirmId(null);
            return;
        }

        const isCurrentlyActive = pubToUpdate.active;
        try {
            const updatedData = {
                name: pubToUpdate.name,
                address: pubToUpdate.address || "",
                phone: pubToUpdate.phone || "",
                active: !isCurrentlyActive
            };
            
            const response = await fetch(`${API_URL}/${confirmId}`, { 
                method: "PUT",
                headers: {
                    ...getAuthHeaders(true),
                },
                body: JSON.stringify(updatedData)
            });
            
            if (response.ok) {
                toast({
                    title: "Thành công",
                    description: isCurrentlyActive ? "Đã ngưng hoạt động nhà xuất bản thành công!" : "Đã kích hoạt hoạt động nhà xuất bản thành công!",
                });
                fetchPublishers();
            } else if (response.status === 401) {
                toast({
                    title: "Lỗi",
                    description: "Bạn không có quyền thực hiện hành động này!",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Lỗi",
                    description: "Cập nhật trạng thái thất bại.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái NXB:", error);
        } finally {
            setConfirmId(null);
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

    const handleExportExcel = () => {
        const headers = ["Mã NXB", "Tên NXB", "Số điện thoại", "Địa chỉ", "Trạng thái"];
        const rows = filteredPublishers.map(p => [
            `PUB-${String(p.id).padStart(3, '0')}`,
            `"${p.name.replace(/"/g, '""')}"`,
            `"${(p.phone || '').replace(/"/g, '""')}"`,
            `"${(p.address || '').replace(/"/g, '""')}"`,
            p.active ? "Hoạt động" : "Ngưng hoạt động"
        ]);
        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `danh_sach_nxb_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
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

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e6bdb8]/20 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Search bar */}
                    <div style={{ position: "relative" }} className="w-full sm:w-64">
                        <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} className="w-4 h-4 text-slate-400" />
                        <input 
                            type="search" 
                            style={{ paddingLeft: "2.5rem" }}
                            placeholder="Tìm kiếm nhà xuất bản..."
                            className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất File</span>
                    </button>

                    {/* View Toggles */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50">
                        <button 
                            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setViewMode('grid')}
                            title="Dạng lưới"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button 
                            className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setViewMode('table')}
                            title="Dạng bảng"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPublishers.map((pub) => {
                        const bookCount = books.filter(b => (b.publisherIds && b.publisherIds.includes(pub.id)) || (b.publisher === pub.name)).length;
                        return (
                            <div 
                                key={pub.id}
                                onClick={() => router.push(`/admin/publishers/${pub.id}`)}
                                className="bg-white border border-[#e6bdb8]/30 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#b70011]/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            {getLogoElement(pub.name, pub.id)}
                                            <div>
                                                <h3 className="font-bold text-slate-800 group-hover:text-[#b70011] transition-colors line-clamp-1">{pub.name}</h3>
                                                <span className="font-mono text-xs text-slate-400">PUB-{String(pub.id).padStart(3, '0')}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                            pub.active ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${pub.active ? 'bg-green-600 animate-pulse' : 'bg-red-400'}`} />
                                            {pub.active ? 'Hoạt động' : 'Tạm ngưng'}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                                        <p className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-400">SĐT:</span> {pub.phone || "---"}
                                        </p>
                                        {pub.address && (
                                            <p className="flex items-center gap-2 line-clamp-1">
                                                <span className="font-semibold text-slate-400">Địa chỉ:</span> {pub.address}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 bg-[#f2f4f6] border border-slate-200/50 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-600">
                                        {bookCount} tác phẩm
                                    </span>

                                    <div className="flex items-center gap-1.5 action-button">
                                        <Link 
                                            href={`/admin/publishers/${pub.id}/edit`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60 flex items-center justify-center text-decoration-none" 
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="w-4.5 h-4.5" />
                                        </Link>
                                        <button 
                                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200/60 flex items-center justify-center cursor-pointer bg-white" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (pub.id) handleToggleConfirmClick(pub.id);
                                            }}
                                            title={pub.active ? "Ẩn nhà xuất bản (Ngưng hoạt động)" : "Hiện nhà xuất bản (Kích hoạt lại)"}
                                        >
                                            {pub.active ? (
                                                <Eye className="w-4.5 h-4.5 text-emerald-600" />
                                            ) : (
                                                <EyeOff className="w-4.5 h-4.5 text-slate-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Bento Add New Placeholder */}
                    <Link 
                        href="/admin/publishers/new" 
                        className="border-2 border-dashed border-[#e6bdb8]/50 hover:border-[#b70011] rounded-xl flex flex-col items-center justify-center p-6 bg-slate-50/50 hover:bg-red-50/20 group cursor-pointer transition-all duration-300 min-h-[170px] text-decoration-none"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#ffdad6] group-hover:text-[#b70011] text-slate-500 transition-all">
                            <Plus className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 group-hover:text-[#b70011] transition-colors">Thêm NXB mới</p>
                        <p className="text-xs text-slate-400 text-center mt-1.5 max-w-[200px]">
                            Mở rộng hệ thống bằng cách thêm nhà xuất bản mới.
                        </p>
                    </Link>
                </div>
            ) : (
                /* List Table Container */
                <div className="bg-white border border-gray-250 rounded-xl overflow-hidden shadow-sm">
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
                                                <div className="flex justify-center items-center gap-1.5 action-button">
                                                    <Link 
                                                        href={`/admin/publishers/${pub.id}/edit`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60 flex items-center justify-center text-decoration-none" 
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4.5 h-4.5" />
                                                    </Link>
                                                    <button 
                                                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200/60 flex items-center justify-center cursor-pointer bg-white" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (pub.id) handleToggleConfirmClick(pub.id);
                                                        }}
                                                        title={pub.active ? "Ẩn nhà xuất bản (Ngưng hoạt động)" : "Hiện nhà xuất bản (Kích hoạt lại)"}
                                                    >
                                                        {pub.active ? (
                                                            <Eye className="w-4.5 h-4.5 text-emerald-600" />
                                                        ) : (
                                                            <EyeOff className="w-4.5 h-4.5 text-slate-400" />
                                                        )}
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
            )}

            <ConfirmModal
                isOpen={confirmId !== null}
                onClose={() => setConfirmId(null)}
                onConfirm={handleConfirmToggle}
                title="Xác Nhận Trạng Thái"
                message={
                    confirmId
                        ? (() => {
                            const p = publishers.find(x => x.id === confirmId);
                            if (!p) return "";
                            return p.active 
                                ? `Bạn có chắc chắn muốn ngưng hoạt động nhà xuất bản "${p.name}"?`
                                : `Bạn có chắc chắn muốn kích hoạt hoạt động lại nhà xuất bản "${p.name}"?`;
                          })()
                        : ""
                }
            />
        </div>
    );
};

export default PublisherList;
