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
      const calculatedRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const updatedSummary = {
        ...data.summary,
        totalRevenue: calculatedRevenue
      };
      
      setSummary(updatedSummary);
      setMonthlyData(data.monthlyRevenue);
      setCategoryData(data.categoryStats);
      setTopBooks(data.topBooks);
      setRecentTransactions(data.recentTransactions);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              Thống kê doanh thu
            </h1>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 ngày qua</SelectItem>
                <SelectItem value="month">30 ngày qua</SelectItem>
                <SelectItem value="quarter">Quý này</SelectItem>
                <SelectItem value="year">Năm nay</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                  {renderGrowth(summary.revenueGrowth)}
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(summary.totalOrders)}
                  </p>
                  {renderGrowth(summary.orderGrowth)}
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Giá trị TB/đơn</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.avgOrderValue)}
                  </p>
                  {renderGrowth(summary.avgGrowth)}
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Khách hàng</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(summary.totalCustomers)}
                  </p>
                  {renderGrowth(summary.customerGrowth)}
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-4/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Biểu đồ doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1e6}M`} />
                    <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), "Doanh thu"]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Doanh thu theo thể loại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, idx) => {
                        const colors = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#6b7280"];
                        return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ"]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                Sách bán chạy nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayTopBooks.map((book, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{idx+1}</div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-foreground truncate">{book.name}</p></div>
                    <div className="text-right"><p className="font-semibold text-foreground">{formatNumber(book.sold)} bán</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Giao dịch gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{tx.id}</p>
                        <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"} className="text-xs">
                          {tx.status === "completed" ? "Hoàn thành" : tx.status === "pending" ? "Đang xử lý" : "Đã hủy"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{tx.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(tx.amount)}</p>
                      <p className="text-sm text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Bar Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Số lượng đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: any) => [formatNumber(Number(value)), "Đơn hàng"]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}