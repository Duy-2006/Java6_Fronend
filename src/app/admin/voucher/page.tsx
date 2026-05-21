// app/admin/voucher/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Ticket, Plus, Search, MoreVertical, Edit, Trash2, 
  Tag, AlertCircle, CheckCircle2, XCircle, Clock
} from "lucide-react";

interface Voucher {
  id: number;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
  status: string;
}

export default function VoucherListPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVouchers = async () => {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
    if (!token) {
      router.push("/admin/login");
      return;
    }
    try {
      const res = await fetch("http://localhost:8080/api/vouchers/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải danh sách voucher");
      const data = await res.json();
      setVouchers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa voucher "${code}"?`)) return;
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
    try {
      const res = await fetch(`http://localhost:8080/api/vouchers/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      fetchVouchers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; bg: string; textCol: string; icon: any }> = {
      ACTIVE: { text: "Hoạt động", bg: "bg-emerald-100", textCol: "text-emerald-700", icon: CheckCircle2 },
      EXPIRED: { text: "Hết hạn", bg: "bg-gray-100", textCol: "text-gray-600", icon: AlertCircle },
      UPCOMING: { text: "Sắp diễn ra", bg: "bg-blue-100", textCol: "text-blue-700", icon: Clock },
      EXHAUSTED: { text: "Hết lượt", bg: "bg-amber-100", textCol: "text-amber-700", icon: XCircle },
      INACTIVE: { text: "Tạm dừng", bg: "bg-rose-100", textCol: "text-rose-700", icon: XCircle },
    };
    const s = statusConfig[status] || { text: status, bg: "bg-gray-100", textCol: "text-gray-700", icon: AlertCircle };
    const Icon = s.icon;
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.textCol}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.text}
      </div>
    );
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tải danh sách voucher...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-700 mb-1">Đã có lỗi xảy ra</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={fetchVouchers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto font-['Inter',sans-serif]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <Ticket className="w-6 h-6" />
            </div>
            Quản lý Voucher
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Tạo và quản lý các mã giảm giá cho khách hàng
          </p>
        </div>
        
        <Link
          href="/admin/voucher/new"
          className="group flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          Thêm Voucher mới
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-gray-50/50 hover:bg-white"
            placeholder="Tìm kiếm mã voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="text-sm text-gray-500 font-medium">
          Hiển thị <span className="text-gray-900 font-bold">{filteredVouchers.length}</span> voucher
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã Voucher</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mức Giảm</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Điều Kiện</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Lượt Dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời Gian</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 uppercase tracking-wide">{v.code}</div>
                        <div className="text-xs text-gray-500">ID: {v.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-emerald-600">
                      {v.discountType === "PERCENT" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}đ`}
                    </div>
                    {v.maxDiscount && v.discountType === "PERCENT" && (
                      <div className="text-xs text-gray-500 mt-0.5">Tối đa: {v.maxDiscount.toLocaleString()}đ</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      Đơn từ <span className="font-semibold">{v.minOrderValue.toLocaleString()}đ</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                      <span className={v.usedCount >= v.usageLimit ? "text-red-600 font-bold" : ""}>
                        {v.usedCount}
                      </span>
                      <span className="mx-1 text-gray-400">/</span>
                      <span>{v.usageLimit}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-2 mx-auto overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${v.usedCount >= v.usageLimit ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min((v.usedCount / v.usageLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        {new Date(v.startDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                        {new Date(v.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(v.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <Link
                        href={`/admin/voucher/${v.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(v.id, v.code)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVouchers.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center border-t border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Ticket className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có voucher nào</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              {searchTerm 
                ? `Không tìm thấy voucher nào phù hợp với "${searchTerm}"`
                : "Bạn chưa tạo bất kỳ mã giảm giá nào. Hãy tạo mã đầu tiên để thu hút khách hàng!"}
            </p>
            {!searchTerm && (
              <Link
                href="/admin/voucher/new"
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tạo voucher mới
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}