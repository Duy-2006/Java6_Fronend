'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getAllOrders } from "@/services/ordersService";
import {
  Search,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Eye,
  TrendingUp,
  Hourglass,
  Check,
  Truck,
  CheckSquare,
  Ban,
  ClipboardList,
  User,
  Phone,
  Calendar,
  DollarSign,
  Grid,
  List,
  CheckCircle2,
  PackageCheck
} from "lucide-react";

// MỤC 4: Bổ sung trạng thái DELIVERED (Giao hàng thành công) vào cấu hình STATUS_MAP
const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-800 border-amber-200",  icon: Hourglass },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-50 text-blue-800 border-blue-200",   icon: PackageCheck },
  SHIPPING: { label: "Đang giao",   cls: "bg-purple-50 text-purple-800 border-purple-200", icon: Truck },
  DELIVERED: { label: "Giao thành công", cls: "bg-teal-50 text-teal-800 border-teal-200", icon: CheckSquare },
  COMPLETED: { label: "Hoàn thành",   cls: "bg-green-50 text-green-800 border-green-200",    icon: CheckSquare },
  CANCELLED: { label: "Đã hủy",       cls: "bg-red-50 text-red-800 border-red-200",         icon: Ban },
};

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState<'physical' | 'audio'>('physical');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const itemsPerPage = 8;
  const router = useRouter();

  const fetchOrders = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getAllOrders(activeTab);
      setOrders(data || []);
      setError("");
    } catch (err: any) {
      console.error("Fetch orders error:", err);
      const msg = err.message || "Không thể tải danh sách đơn hàng.";
      setError(msg);
      setToast({ msg, type: 'error' });

      if (msg.includes("Token hết hạn") || msg.includes("401")) {
        localStorage.removeItem("access_token");
        setTimeout(() => {
          router.push("/admin/login");
        }, 2000);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    document.title = "Danh sách Đơn Hàng - Libris Admin";
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Đảm bảo safeOrders luôn luôn là mảng
  const safeOrders = Array.isArray(orders) ? orders : [];

  let filtered = searchQuery
    ? safeOrders.filter(
        (order) =>
          (order && (order.orderCode || order.id?.toString() || "")).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order && (order.customerName || "")).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order && (order.customerPhone || "")).includes(searchQuery)
      )
    : [...safeOrders]; // Clone to avoid mutating original

  if (statusFilter !== "ALL") {
    filtered = filtered.filter((order) => order.status === statusFilter);
  }

  // MỤC 5: Sắp xếp đơn hàng theo trạng thái (ưu tiên xử lý) và ngày cũ nhất
  const statusPriority: Record<string, number> = {
    PENDING: 1,
    CONFIRMED: 2,
    SHIPPING: 3,
    DELIVERED: 4,
    COMPLETED: 5,
    CANCELLED: 6
  };

  const sortedFiltered = filtered.sort((a, b) => {
    const dateA = new Date(a.orderDate).getTime();
    const dateB = new Date(b.orderDate).getTime();

    if (activeTab === 'audio') {
      // Sách nói: Mới nhất lên đầu (không phân biệt trạng thái)
      return dateB - dateA;
    }

    // Sách giấy: Sắp xếp theo ưu tiên trạng thái
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // PENDING: Cũ nhất -> mới nhất (Ascending)
    if (a.status === 'PENDING') {
      return dateA - dateB;
    }
    
    // Các trạng thái khác: Mới nhất -> cũ nhất (Descending)
    return dateB - dateA;
  });

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil((sortedFiltered?.length || 0) / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  const paginatedOrders = Array.isArray(sortedFiltered) 
    ? sortedFiltered.slice(startIndex, startIndex + itemsPerPage) 
    : [];

  // Statistics calculation - Cập nhật cho Mục 4
  const totalCount = safeOrders.length;
  
  const processingCount = safeOrders.filter(
    (o) => o && ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'].includes(o.status)
  ).length;
  
  const totalRevenue = safeOrders
    .filter((o) => o && o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.totalAmount ?? 0) + (o.shippingFee ?? 0), 0);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const dataToExport = orders.map(order => {
        const orderDate = order.orderDate
          ? new Date(order.orderDate).toLocaleString("vi-VN", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : "—";
        return {
          'Mã Đơn': order.orderCode || order.id,
          'Khách Hàng': order.customerName || "Khách lẻ",
          'Số Điện Thoại': order.customerPhone || "—",
          'Ngày Đặt': orderDate,
          'Tổng Tiền (đ)': (order.totalAmount ?? 0) + (order.shippingFee ?? 0),
          'Trạng Thái': STATUS_MAP[order.status]?.label || order.status,
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng');
      XLSX.writeFile(wb, `Danh_sach_don_hang_Libris_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setToast({ msg: "Xuất file Excel thành công!", type: 'success' });
    } catch (err: any) {
      console.error('Error exporting orders:', err);
      setToast({ msg: 'Không thể xuất file báo cáo: ' + err.message, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown transition-all ${
          toast.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <p className="text-sm font-semibold">{toast.msg}</p>
          </div>
          <button 
            type="button" 
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer" 
            onClick={() => setToast(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border bg-red-50 text-red-800 border-red-200 shadow-sm flex flex-col gap-2 animate__animated animate__fadeInDown">
          <p className="text-sm font-semibold">{error}</p>
          {error.includes("Token hết hạn") && (
            <div>
              <Link href="/admin/login" className="inline-block bg-[#b70011] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#b70011]/90">
                Đăng nhập lại
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Header section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#b70011]">Đơn hàng</span>
          </nav>
          <h2 className="text-2xl font-bold text-[#191c1e]">Quản lý Đơn hàng</h2>
          <p className="text-sm text-[#5c403c]">Theo dõi trạng thái giao hàng, kiểm tra chi tiết thanh toán và doanh thu thực tế.</p>
        </div>
      </section>

      {/* Tabs Phân Loại */}
      <div className="flex space-x-4 mb-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('physical')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'physical'
              ? 'border-[#b70011] text-[#b70011]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Sách Vật Lý
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'audio'
              ? 'border-[#b70011] text-[#b70011]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Sách Nói
        </button>
      </div>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#b70011] group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Tổng đơn hàng</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{totalCount}</h3>
            <p className="font-semibold text-xs text-[#b70011] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              Tất cả đơn hàng hiện có
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
            <Hourglass className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Đang xử lý</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{processingCount}</h3>
            <p className="font-semibold text-xs text-amber-600 mt-1">
              Đơn hàng đang trong chu trình xử lý
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300 sm:col-span-2 lg:col-span-1">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Doanh thu hoàn thành</p>
            <h3 className="text-2xl font-bold text-emerald-600 leading-none">
              {new Intl.NumberFormat("vi-VN").format(totalRevenue)} <span className="text-sm font-semibold text-slate-500">đ</span>
            </h3>
            <p className="font-semibold text-xs text-slate-500 mt-1">
              Dựa trên các đơn hàng Hoàn thành
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e6bdb8]/20 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm mã đơn, khách hàng..."
              className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
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

          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          {/* View Toggles */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50">
            <button 
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
              aria-label="Dạng lưới"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-[#b70011] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setViewMode('table')}
              title="Dạng bảng"
              aria-label="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Filter Container on the Right */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <label htmlFor="status-filter" className="text-sm font-semibold text-slate-500 whitespace-nowrap">
            Lọc:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset page on filter change
            }}
            className="bg-[#f2f4f6]/80 border-none rounded-lg py-1.5 pl-3 pr-8 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none text-slate-700 font-medium appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em'
            }}
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="SHIPPING">Đang giao</option>
            <option value="DELIVERED">Giao thành công</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {paginatedOrders.map((order) => {
            const status = STATUS_MAP[order.status] ?? {
              label: order.status,
              cls: "bg-slate-50 text-slate-800 border-slate-200",
              icon: ClipboardList
            };
            const StatusIcon = status.icon;
            const orderDate = order.orderDate
              ? new Date(order.orderDate).toLocaleString("vi-VN", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "—";
            const amount = new Intl.NumberFormat("vi-VN").format((order.totalAmount ?? 0) + (order.shippingFee ?? 0));

            return (
              <div key={order.id} className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                      {order.orderCode || `#${order.id}`}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{order.customerName || "Khách lẻ"}</span>
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{order.customerPhone || "—"}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{orderDate}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng tiền</p>
                    <p className="text-base font-bold text-[#b70011]">
                      {amount} <span className="text-xs font-normal text-slate-500">đ</span>
                    </p>
                  </div>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="p-2 bg-slate-50 hover:bg-[#b70011] hover:text-white text-slate-700 rounded-lg border border-slate-200/60 transition-all flex items-center justify-center cursor-pointer"
                    title="Chi tiết đơn hàng"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center text-slate-400 py-12 text-sm bg-white border border-[#e6bdb8]/30 rounded-xl">
              Không tìm thấy đơn hàng nào phù hợp.
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e6bdb8]/20 text-xs font-bold text-[#916f6b] uppercase tracking-wider">
                  <th className="px-6 py-4 text-center w-[120px]">Mã Đơn</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Ngày đặt</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right w-[140px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10 text-sm">
                {paginatedOrders.map((order) => {
                  const status = STATUS_MAP[order.status] ?? {
                    label: order.status,
                    cls: "bg-slate-50 text-slate-800 border-slate-200",
                    icon: ClipboardList
                  };
                  const StatusIcon = status.icon;
                  const orderDate = order.orderDate
                    ? new Date(order.orderDate).toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : "—";
                  const amount = new Intl.NumberFormat("vi-VN").format((order.totalAmount ?? 0) + (order.shippingFee ?? 0));

                  return (
                    <tr key={order.id} className="hover:bg-[#b70011]/5 transition-colors duration-150 group">
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {order.orderCode || order.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{order.customerName || "Khách lẻ"}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {order.customerPhone || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{orderDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#b70011]">
                        {amount} <span className="text-xs font-normal text-slate-500">đ</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.cls}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 bg-slate-50 hover:bg-[#b70011] hover:text-white text-slate-700 rounded-lg border border-slate-200/60 transition-all flex items-center justify-center cursor-pointer"
                            title="Chi tiết đơn hàng"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                      Không tìm thấy đơn hàng nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border border-[#e6bdb8]/30 rounded-xl bg-white shadow-sm gap-4 mt-6">
          <p className="text-xs font-semibold text-[#916f6b]">
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)} của {filtered.length} đơn hàng
          </p>
          <div className="flex items-center gap-1.5">
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {(() => {
              let startPage = Math.max(1, currentPage - 2);
              let endPage = Math.min(totalPages, currentPage + 2);
              if (currentPage <= 3) endPage = Math.min(totalPages, 5);
              if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);
              return Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i).map(page => (
                <button
                  key={page}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    currentPage === page 
                      ? 'bg-[#b70011] text-white shadow-md shadow-[#b70011]/15' 
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ));
            })()}

            <button 
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-100">
        <p className="text-[10px] text-[#916f6b] font-bold uppercase tracking-widest">
          © 2026 Libris Management System. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang tải trang...</p>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}

