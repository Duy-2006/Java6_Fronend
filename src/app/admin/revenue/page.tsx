"use client";

import { useState, useEffect } from "react";
import { getAllOrders } from "@/services/ordersService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Book,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Download,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import * as XLSX from 'xlsx';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

interface StatsSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  avgOrderValue: number;
  avgGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

interface CategoryStat {
  categoryName: string;
  value: number;
  color: string;
}

interface TopBook {
  bookId: number;
  title: string;
  sold: number;
}

interface RecentTransaction {
  orderCode: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

export default function RevenueStatisticsPage() {
  const [timeRange, setTimeRange] = useState("year");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([]);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const fetchStats = async (range: string) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vui lòng đăng nhập");
      setLoading(false);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(`${baseUrl}/api/admin/stats?range=${range}`, { headers });
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu thống kê");
      const data = await res.json();
      
      // Lọc các đơn hàng đã giao thành công (COMPLETED) để tính tổng doanh thu
      const allOrders = await getAllOrders();
      const completedOrders = allOrders.filter(o => o.status === "COMPLETED");
      const calculatedRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0) + (o.shippingFee ?? 0), 0);
      
      const updatedSummary = {
        ...data.summary,
        totalRevenue: calculatedRevenue
      };
      
      const updatedRecentTransactions = data.recentTransactions.map((tx: RecentTransaction) => {
        const orderInfo = allOrders.find(o => o.orderCode === tx.orderCode);
        return {
          ...tx,
          amount: orderInfo ? ((orderInfo.totalAmount ?? 0) + (orderInfo.shippingFee ?? 0)) : tx.amount
        };
      });

      setSummary(updatedSummary);
      setMonthlyData(data.monthlyRevenue);
      setCategoryData(data.categoryStats);
      setTopBooks(data.topBooks);
      setRecentTransactions(updatedRecentTransactions);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange]);

  const handleExport = () => {
    if (!summary || !monthlyData.length) {
      alert("Chưa có dữ liệu để xuất");
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      // Sheet tổng quan
      const summarySheet = XLSX.utils.json_to_sheet([
        { "Chỉ tiêu": "Tổng doanh thu", "Giá trị": formatCurrency(summary.totalRevenue), "Tăng trưởng": `${summary.revenueGrowth.toFixed(1)}%` },
        { "Chỉ tiêu": "Tổng đơn hàng", "Giá trị": formatNumber(summary.totalOrders), "Tăng trưởng": `${summary.orderGrowth.toFixed(1)}%` },
        { "Chỉ tiêu": "Giá trị TB/đơn", "Giá trị": formatCurrency(summary.avgOrderValue), "Tăng trưởng": `${summary.avgGrowth.toFixed(1)}%` },
        { "Chỉ tiêu": "Khách hàng", "Giá trị": formatNumber(summary.totalCustomers), "Tăng trưởng": `${summary.customerGrowth.toFixed(1)}%` },
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Tổng quan");

      // Sheet doanh thu theo tháng
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(wb, monthlySheet, "Doanh thu theo tháng");

      // Sheet thể loại
      const categorySheet = XLSX.utils.json_to_sheet(categoryData.map(c => ({ "Thể loại": c.categoryName, "Tỷ lệ %": c.value })));
      XLSX.utils.book_append_sheet(wb, categorySheet, "Thể loại");

      // Sheet sách bán chạy
      const booksSheet = XLSX.utils.json_to_sheet(topBooks.map(b => ({ "Tên sách": b.title, "Số lượng bán": b.sold })));
      XLSX.utils.book_append_sheet(wb, booksSheet, "Sách bán chạy");

      // Sheet giao dịch gần đây
      const txSheet = XLSX.utils.json_to_sheet(recentTransactions.map(t => ({
        "Mã đơn": t.orderCode,
        "Khách hàng": t.customerName,
        "Số tiền": formatCurrency(t.amount),
        "Trạng thái": t.status,
        "Ngày": t.date,
      })));
      XLSX.utils.book_append_sheet(wb, txSheet, "Giao dịch gần đây");

      XLSX.writeFile(wb, `baocao_doanhthu_${timeRange}_${new Date().toISOString().slice(0,19)}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Xuất báo cáo thất bại");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Lỗi: {error}</p>
          <Button onClick={() => fetchStats(timeRange)} className="mt-4">Thử lại</Button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const pieData = categoryData.map(item => ({
    name: item.categoryName,
    value: item.value,
    color: item.color,
  }));

  const displayTopBooks = topBooks.map(book => ({
    name: book.title,
    sold: book.sold,
  }));

  const transactions = recentTransactions.map(tx => ({
    id: tx.orderCode,
    customer: tx.customerName,
    amount: tx.amount,
    status: tx.status === "Hoàn thành" ? "completed" : (tx.status === "Đã hủy" ? "cancelled" : "pending"),
    date: new Date(tx.date).toLocaleDateString("vi-VN"),
  }));

  // Helper để hiển thị mũi tên và màu sắc tăng trưởng
  const renderGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className="flex items-center gap-1 text-sm">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-green-600" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-600" />
        )}
        <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{growth.toFixed(1)}%
        </span>
        <span className="text-muted-foreground">so với kỳ trước</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-sans">
      <div className="max-w-[1600px] w-full mx-auto p-4 md:p-6 space-y-6 animate__animated animate__fadeIn">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#b70011]">Doanh thu</span>
            </nav>
            <h2 className="text-2xl font-bold text-[#191c1e] font-sans flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-[#b70011]" />
              Báo cáo Doanh thu
            </h2>
            <p className="text-sm text-[#5c403c] font-sans">
              Phân tích hiệu suất tài chính và xu hướng tăng trưởng.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px] bg-white border-[#e6bdb8]/40 text-[#191c1e]">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 ngày qua</SelectItem>
                <SelectItem value="month">30 ngày qua</SelectItem>
                <SelectItem value="quarter">Quý này</SelectItem>
                <SelectItem value="year">Năm nay</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#b70011] text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-[#b70011]/90 transition-all border-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Tổng doanh thu */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#ffdad6] rounded-lg text-[#b70011]">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-[#b70011] font-bold text-xs flex items-center bg-[#b70011]/5 px-2 py-1 rounded-full gap-0.5">
                {summary.revenueGrowth >= 0 ? "+" : ""}{summary.revenueGrowth.toFixed(1)}%
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-[#191c1e]">{formatCurrency(summary.totalRevenue)}</h3>
              <p className="text-[#916f6b] text-[11px] mt-2">So với kỳ trước</p>
            </div>
          </div>

          {/* Card 2: Tổng đơn hàng */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#d5e0f8] rounded-lg text-[#111c2d]">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <span className="text-[#b70011] font-bold text-xs flex items-center bg-[#b70011]/5 px-2 py-1 rounded-full gap-0.5">
                {summary.orderGrowth >= 0 ? "+" : ""}{summary.orderGrowth.toFixed(1)}%
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Tổng đơn hàng</p>
              <h3 className="text-2xl font-bold text-[#191c1e]">{formatNumber(summary.totalOrders)}</h3>
              <p className="text-[#916f6b] text-[11px] mt-2">So với kỳ trước</p>
            </div>
          </div>

          {/* Card 3: Giá trị trung bình/đơn */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#e6e8ea] rounded-lg text-[#51596f]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[#b70011] font-bold text-xs flex items-center bg-[#b70011]/5 px-2 py-1 rounded-full gap-0.5">
                {summary.avgGrowth >= 0 ? "+" : ""}{summary.avgGrowth.toFixed(1)}%
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Giá trị TB/đơn</p>
              <h3 className="text-2xl font-bold text-[#191c1e]">{formatCurrency(summary.avgOrderValue)}</h3>
              <p className="text-[#916f6b] text-[11px] mt-2">So với kỳ trước</p>
            </div>
          </div>

          {/* Card 4: Khách hàng */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e6bdb8]/30 hover:border-[#b70011]/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#ffdad6] rounded-lg text-[#93000a]">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[#b70011] font-bold text-xs flex items-center bg-[#b70011]/5 px-2 py-1 rounded-full gap-0.5">
                {summary.customerGrowth >= 0 ? "+" : ""}{summary.customerGrowth.toFixed(1)}%
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider mb-1">Khách hàng</p>
              <h3 className="text-2xl font-bold text-[#191c1e]">{formatNumber(summary.totalCustomers)}</h3>
              <p className="text-[#916f6b] text-[11px] mt-2">So với kỳ trước</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 flex flex-col">
            <div className="px-6 py-4 border-b border-[#e6bdb8]/20 flex justify-between items-center">
              <h4 className="font-semibold text-[#191c1e] text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#b70011]" />
                Tăng trưởng Doanh thu
              </h4>
            </div>
            <div className="p-6 flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b70011" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#b70011" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e8ea" />
                  <XAxis dataKey="month" stroke="#916f6b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#916f6b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1e6}M`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), "Doanh thu"]} contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e6bdb8", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#b70011" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 flex flex-col">
            <div className="px-6 py-4 border-b border-[#e6bdb8]/20">
              <h4 className="font-semibold text-[#191c1e] text-base flex items-center gap-2">
                <Book className="w-5 h-5 text-[#b70011]" />
                Doanh thu theo thể loại
              </h4>
            </div>
            <div className="p-6 flex-1 min-h-[300px] flex items-center justify-center">
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, idx) => {
                        const colors = ["#b70011", "#545f73", "#e0a0a0", "#a0b0c0", "#7c8c9c", "#e6bdb8", "#ffdad6", "#916f6b", "#5c403c", "#191c1e"];
                        return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ"]} contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e6bdb8", borderRadius: "8px" }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-foreground font-medium">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#e6bdb8]/20">
              <h4 className="font-semibold text-[#191c1e] text-base flex items-center gap-2">
                <Book className="w-5 h-5 text-[#b70011]" />
                Sách bán chạy nhất
              </h4>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {displayTopBooks.map((book, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-sm font-bold text-[#b70011]">{idx+1}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-[#191c1e] truncate">{book.name}</p></div>
                  <div className="text-right"><p className="font-bold text-[#191c1e]">{formatNumber(book.sold)} <span className="text-xs text-[#916f6b] font-normal">đã bán</span></p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e6bdb8]/20 flex justify-between items-center">
              <h4 className="font-semibold text-[#191c1e] text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#b70011]" />
                Giao dịch gần đây
              </h4>
            </div>
            <div className="p-6 divide-y divide-[#e6bdb8]/10">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                        {tx.id}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        tx.status === "completed" 
                          ? "bg-green-50 text-green-800 border-green-200" 
                          : tx.status === "pending" 
                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                            : "bg-red-50 text-red-800 border-red-200"
                      }`}>
                        {tx.status === "completed" ? "Hoàn thành" : tx.status === "pending" ? "Đang xử lý" : "Đã hủy"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{tx.customer}</p>
                    <p className="text-xs text-[#916f6b]">{tx.customer.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')}@email.com</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#b70011]">{formatCurrency(tx.amount)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e6bdb8]/30 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#e6bdb8]/20">
            <h4 className="font-semibold text-[#191c1e] text-base flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#b70011]" />
              Số lượng đơn hàng
            </h4>
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e8ea" />
                <XAxis dataKey="month" stroke="#916f6b" fontSize={11} tickLine={false} />
                <YAxis stroke="#916f6b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: any) => [formatNumber(Number(value)), "Đơn hàng"]} contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e6bdb8", borderRadius: "8px" }} />
                <Bar dataKey="orders" fill="#545f73" radius={[4,4,0,0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}