'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  BookOpen,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Database
} from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { getDashboardStats } from '@/services/statsService';
import { getAllOrders } from '@/services/ordersService';
import { getAllBooks } from '@/services/booksService';
import { getAllAuthors } from '@/services/authorsService';

// Status styling mapping for order status matching the Red Theme
const STATUS_BADGES: Record<string, string> = {
  'Chờ xác nhận': 'bg-amber-100 text-amber-700 border-amber-200',
  'PENDING': 'bg-amber-100 text-amber-700 border-amber-200',
  'Đã xác nhận': 'bg-blue-100 text-blue-700 border-blue-200',
  'Đang giao hàng': 'bg-purple-100 text-purple-700 border-purple-200',
  'Hoàn thành': 'bg-green-100 text-green-700 border-green-200',
  'COMPLETED': 'bg-green-100 text-green-700 border-green-200',
  'Đã hủy': 'bg-red-100 text-red-700 border-red-200',
  'CANCELLED': 'bg-red-100 text-red-700 border-red-200',
  'Đang xử lý': 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'year' | 'custom'>('all');
  const [selectedYear, setSelectedYear] = useState('');
  const [isRebuilding, setIsRebuilding] = useState(false);

  // States
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    customersGrowth: 0
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [booksSold, setBooksSold] = useState(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };
  
  const formatGrowth = (value: number) => {
    const formatted = value.toFixed(1) + '%';
    return value >= 0 ? `+${formatted}` : formatted;
  };

  const getBookImageSrc = (imageUrl: string) => {
    if (!imageUrl || !imageUrl.trim()) return "/images/book-default.jpg";
    let cleanUrl = imageUrl;
    if (cleanUrl.startsWith("books/")) {
      cleanUrl = cleanUrl.substring(6);
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
    return `${apiBase}/uploads/books/${cleanUrl}`;
  };

  const loadDashboardData = async (isSilent = false, range = timeRange, startDate = customStartDate, endDate = customEndDate) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // Fetch stats, orders, books and authors
      const [data, allOrders, allBooksList, allAuthorsList] = await Promise.all([
        getDashboardStats(range, startDate, endDate),
        getAllOrders(),
        getAllBooks().catch(() => []),
        getAllAuthors().catch(() => [])
      ]);
      
      const { summary, monthlyRevenue, topBooks, recentTransactions } = data;

      // Calculate Stats
      setStats({
        totalRevenue: summary?.totalRevenue || 0,
        totalOrders: summary?.totalOrders || 0,
        totalCustomers: summary?.totalCustomers || 0,
        revenueGrowth: summary?.revenueGrowth || 0,
        ordersGrowth: summary?.orderGrowth || 0,
        customersGrowth: summary?.customerGrowth || 0
      });

      // Recent Orders - Cập nhật số tiền bao gồm cả phí ship như trang doanh thu
      const updatedRecentTransactions = (recentTransactions || []).map((tx: any) => {
        const orderInfo = allOrders.find((o: any) => o.orderCode === tx.orderCode);
        return {
          ...tx,
          amount: orderInfo ? ((orderInfo.totalAmount ?? 0) + (orderInfo.shippingFee ?? 0)) : tx.amount
        };
      });
      setRecentOrders(updatedRecentTransactions);

      // Generate Monthly Trend
      const trendData = (monthlyRevenue || []).map((item: any) => ({
        name: item.month,
        'Doanh thu': item.revenue,
        'Đơn hàng': item.orders
      }));
      setMonthlyTrend(trendData);

      // Create maps for dynamic book cover, author and price retrieval
      const authorMap = new Map<number, string>();
      allAuthorsList.forEach((a: any) => {
        if (a.id && a.name) {
          authorMap.set(a.id, a.name);
        }
      });

      const bookDetailsMap = new Map<string, any>();
      allBooksList.forEach((b: any) => {
        bookDetailsMap.set(b.title.toLowerCase().trim(), {
          imageUrl: b.imageUrl,
          price: b.price,
          authorName: b.authorId ? authorMap.get(b.authorId) : 'Tác giả'
        });
      });

      const bookDetailsMapById = new Map<number, any>();
      allBooksList.forEach((b: any) => {
        if (b.id) {
          bookDetailsMapById.set(b.id, {
            imageUrl: b.imageUrl,
            price: b.price,
            authorName: b.authorId ? authorMap.get(b.authorId) : 'Tác giả'
          });
        }
      });

      // Generate Top Selling Books dynamically without hardcoding images
      const topBooksData = (topBooks || []).map((b: any) => {
        const idMatch = b.bookId ? bookDetailsMapById.get(b.bookId) : (b.id ? bookDetailsMapById.get(b.id) : null);
        const titleMatch = bookDetailsMap.get(b.title?.toLowerCase().trim());
        const match = idMatch || titleMatch;

        return {
          title: b.title,
          sales: b.sold,
          price: match?.price || 120000,
          imageUrl: match?.imageUrl || '',
          authorName: match?.authorName || 'Tác giả',
          revenue: (b.sold || 0) * (match?.price || 120000)
        };
      });
      setTopProducts(topBooksData);

      // Calculate books sold
      const calculatedBooksSold = summary?.booksSold || summary?.totalBooksSold || (topBooks || []).reduce((sum: number, b: any) => sum + (b.sold || 0), 0) || 0;
      setBooksSold(calculatedBooksSold);

    } catch (err: any) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err.message || 'Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportReport = async () => {
    try {
      // Import xlsx dynamically on the client side
      const XLSX = await import('xlsx');

      // 1. Sheet 1: Tổng quan
      const overviewData = [
        { 'Chỉ số': 'Doanh Thu', 'Giá trị': formatCurrency(stats.totalRevenue) },
        { 'Chỉ số': 'Tổng Đơn Hàng', 'Giá trị': stats.totalOrders },
        { 'Chỉ số': 'Sách Đã Bán', 'Giá trị': booksSold },
        { 'Chỉ số': 'Khách Hàng', 'Giá trị': stats.totalCustomers }
      ];
      const wsOverview = XLSX.utils.json_to_sheet(overviewData);

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');

      // Save Workbook
      XLSX.writeFile(wb, `Bao_cao_dashboard_BookStore_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Error exporting report:', err);
      alert('Không thể xuất báo cáo: ' + err.message);
    }
  };

  const handleRebuildIndex = async () => {
    if (!confirm('Bạn có chắc chắn muốn cập nhật lại toàn bộ dữ liệu sách vào hệ thống AI không? Quá trình này có thể mất một lúc.')) {
      return;
    }
    
    setIsRebuilding(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await authFetch(`${apiBase}/api/admin/ai-index/rebuild`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Lỗi khi cập nhật dữ liệu AI');
      }
      
      alert('Đã cập nhật dữ liệu AI thành công! Chatbot hiện đã có thể trả lời các câu hỏi về sách.');
    } catch (err: any) {
      console.error('Error rebuilding index:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setIsRebuilding(false);
    }
  };

  useEffect(() => {
    loadDashboardData(false, 'all', '', '');
  }, []);

  const handleCustomDateFilter = () => {
    if (!customStartDate && !customEndDate) {
      // Nếu trống cả 2, mặc định là tất cả thời gian
      setTimeRange('all');
      loadDashboardData(true, 'all', '', '');
      return;
    }
    if (!customStartDate || !customEndDate) {
      alert('Vui lòng chọn cả từ ngày và đến ngày, hoặc để trống cả hai để xem tất cả thời gian.');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('Từ ngày không được lớn hơn đến ngày.');
      return;
    }
    setTimeRange('custom');
    loadDashboardData(true, 'custom', customStartDate, customEndDate);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#b70011] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải số liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Tổng quan Dashboard</h2>
          {/* Bộ lọc thời gian */}
          <div className="flex items-center gap-1.5 bg-[#fcf8f8] p-1.5 rounded-lg border border-[#e6bdb8]/30 shadow-sm mt-2 w-fit">
            <select
              className="px-2 py-1 bg-white text-[#191c1e] rounded border border-[#e6bdb8]/50 text-xs focus:outline-none focus:ring-1 focus:ring-[#b70011] cursor-pointer"
              value={filterMode}
              onChange={(e) => {
                const mode = e.target.value as 'all' | 'year' | 'custom';
                setFilterMode(mode);
                if (mode === 'all') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setSelectedYear('');
                  setTimeRange('all');
                  loadDashboardData(true, 'all', '', '');
                } else if (mode === 'year') {
                  setSelectedYear('');
                }
              }}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="year">Lọc theo năm</option>
              <option value="custom">Khoảng thời gian</option>
            </select>

            {filterMode === 'year' && (
              <>
                <span className="text-[#e6bdb8] mx-1">|</span>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Nhập năm..."
                  className="px-2 py-1 bg-white text-[#191c1e] rounded border border-[#e6bdb8]/50 text-xs focus:outline-none focus:ring-1 focus:ring-[#b70011] w-[90px]"
                  value={selectedYear}
                  onChange={(e) => {
                    const year = e.target.value.replace(/[^0-9]/g, '');
                    setSelectedYear(year);
                  }}
                />
                <button 
                  onClick={() => {
                    if (selectedYear && selectedYear.length === 4) {
                      const start = `${selectedYear}-01-01`;
                      const end = `${selectedYear}-12-31`;
                      setCustomStartDate(start);
                      setCustomEndDate(end);
                      setTimeRange('custom');
                      loadDashboardData(true, 'custom', start, end);
                    } else {
                      alert('Vui lòng nhập năm hợp lệ (4 chữ số).');
                    }
                  }}
                  className="px-3 py-1 bg-[#b70011] text-white rounded text-xs font-semibold shadow-sm hover:bg-[#b70011]/90 transition-all cursor-pointer"
                >
                  Lọc
                </button>
              </>
            )}

            {filterMode === 'custom' && (
              <>
                <span className="text-[#e6bdb8] mx-1">|</span>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 bg-white text-[#191c1e] rounded border border-[#e6bdb8]/50 text-xs focus:outline-none focus:ring-1 focus:ring-[#b70011] w-[115px] cursor-pointer"
                />
                <span className="text-xs text-[#916f6b] font-bold">-</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 bg-white text-[#191c1e] rounded border border-[#e6bdb8]/50 text-xs focus:outline-none focus:ring-1 focus:ring-[#b70011] w-[115px] cursor-pointer"
                />
                <button 
                  onClick={handleCustomDateFilter}
                  className="px-3 py-1 bg-[#b70011] text-white rounded text-xs font-semibold shadow-sm hover:bg-[#b70011]/90 transition-all cursor-pointer"
                >
                  Lọc
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          <button 
            onClick={handleRebuildIndex}
            disabled={isRebuilding}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-blue-700 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRebuilding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            {isRebuilding ? 'Đang cập nhật...' : 'Cập nhật AI'}
          </button>
          <button 
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#b70011] text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-[#b70011]/90 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 shadow-sm text-sm font-sans">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Doanh Thu */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#ffdad6] rounded-lg text-[#b70011]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Doanh Thu</p>
            <h3 className="text-2xl font-bold text-[#191c1e]">{formatCurrency(stats.totalRevenue)}</h3>
          </div>
        </div>

        {/* Tổng Đơn Hàng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#d5e0f8] rounded-lg text-[#111c2d]">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Tổng Đơn Hàng</p>
            <h3 className="text-2xl font-bold text-[#191c1e]">{stats.totalOrders.toLocaleString()}</h3>
          </div>
        </div>

        {/* Sách Đã Bán */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#e6e8ea] rounded-lg text-[#51596f]">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Sách Đã Bán</p>
            <h3 className="text-2xl font-bold text-[#191c1e]">{booksSold.toLocaleString()}</h3>
          </div>
        </div>

        {/* Khách Hàng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#ffdad6] rounded-lg text-[#93000a]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Khách Hàng</p>
            <h3 className="text-2xl font-bold text-[#191c1e]">{stats.totalCustomers.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 flex flex-col">
          <div className="px-6 py-4 border-b border-[#e6bdb8]/20 flex justify-between items-center">
            <h4 className="font-semibold text-[#191c1e] text-base">Biểu Đồ Doanh Thu</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b70011]"></span>
                <span className="text-xs text-[#916f6b] font-medium">Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#545f73]"></span>
                <span className="text-xs text-[#916f6b] font-medium">Đơn hàng</span>
              </div>
            </div>
          </div>
          <div className="p-6 flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b70011" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#b70011" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e8ea" />
                <XAxis dataKey="name" stroke="#916f6b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#916f6b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#916f6b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'Doanh thu') return [formatCurrency(value), name];
                    return [value, name];
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e6bdb8', backgroundColor: '#ffffff' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="Doanh thu" stroke="#b70011" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Bar yAxisId="right" dataKey="Đơn hàng" fill="#545f73" radius={[4, 4, 0, 0]} barSize={25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Books */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 flex flex-col">
          <div className="px-6 py-4 border-b border-[#e6bdb8]/20 flex justify-between items-center">
            <h4 className="font-semibold text-[#191c1e] text-base">Sách Bán Chạy</h4>
            <Link href="/admin/books" className="text-[#b70011] text-xs font-semibold hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[450px]">
            {topProducts.length === 0 && (
              <div className="text-center text-slate-400 py-12 text-sm">Chưa có dữ liệu sách bán chạy</div>
            )}
            {topProducts.map((p, idx) => {
              return (
                <div key={idx} className="flex gap-4 items-center group cursor-pointer">
                  <div className="w-12 h-16 bg-[#e6e8ea] rounded shadow-sm overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105 flex items-center justify-center">
                    <img 
                      alt={p.title} 
                      className="w-full h-full object-contain" 
                      src={getBookImageSrc(p.imageUrl)} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/book-default.jpg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#191c1e] truncate group-hover:text-[#b70011] transition-colors" title={p.title}>{p.title}</p>
                    <p className="text-xs text-[#5c403c]">{p.authorName}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] font-bold text-[#b70011] px-1.5 py-0.5 bg-[#b70011]/5 rounded">{p.sales} Đã bán</span>
                      <span className="text-xs font-bold text-[#191c1e]">{formatCurrency(p.price)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e6bdb8]/20 flex justify-between items-center">
          <h4 className="font-semibold text-[#191c1e] text-base">Đơn Hàng Gần Đây</h4>
          <Link href="/admin/orders" className="text-[#b70011] text-xs font-semibold hover:underline">
            Tất cả đơn hàng
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f6]/50 border-b border-[#e6bdb8]/20">
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Mã Đơn</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Khách Hàng</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Ngày Đặt</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-4 text-xs font-bold text-[#916f6b] uppercase tracking-wider text-right">Số Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6bdb8]/10">
              {recentOrders.map((o, idx) => {
                const dateStr = o.date ? new Date(o.date).toLocaleDateString('vi-VN') : '—';
                return (
                  <tr key={idx} className="hover:bg-[#b70011]/5 transition-colors duration-150 group">
                    <td className="px-6 py-4 font-mono text-sm text-[#191c1e]">{o.orderCode || o.id}</td>
                    <td className="px-6 py-4 text-[#191c1e] font-semibold">{o.customerName || 'Khách vãng lai'}</td>
                    <td className="px-6 py-4 text-[#5c403c] text-sm">{dateStr}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${STATUS_BADGES[o.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#191c1e] group-hover:text-[#b70011] text-right">{formatCurrency(o.amount || 0)}</td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
