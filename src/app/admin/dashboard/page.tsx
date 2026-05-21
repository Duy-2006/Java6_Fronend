'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Users,
  DollarSign,
  ShoppingCart,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { getDashboardStats } from '@/services/statsService';

// Status styling mapping for bootstrap order status
const STATUS_BADGES: Record<string, string> = {
  'Chờ xác nhận': 'bg-warning text-dark',
  'Đã xác nhận': 'bg-info text-dark',
  'Đang giao hàng': 'bg-light text-primary border',
  'Hoàn thành': 'bg-success text-white',
  'Đã hủy': 'bg-danger text-white',
  'Đang xử lý': 'bg-secondary text-white'
};

const COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#319795'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };
  
  const formatGrowth = (value: number) => {
    const formatted = value.toFixed(1) + '%';
    return value >= 0 ? `+${formatted}` : formatted;
  };

  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getDashboardStats('year');
      
      const { summary, monthlyRevenue, categoryStats, topBooks, recentTransactions } = data;

      // 1. Calculate Stats
      setStats({
        totalRevenue: summary?.totalRevenue || 0,
        totalOrders: summary?.totalOrders || 0,
        totalCustomers: summary?.totalCustomers || 0,
        revenueGrowth: summary?.revenueGrowth || 0,
        ordersGrowth: summary?.orderGrowth || 0,
        customersGrowth: summary?.customerGrowth || 0
      });

      // 2. Recent Orders
      setRecentOrders(recentTransactions || []);

      // 3. Status Distribution (Mock based on categoryStats or fallback since backend categoryStats is categories, not order status. We will map categoryStats directly to PieChart as "Doanh thu theo thể loại")
      const distData = (categoryStats || []).map((cat: any) => ({
        name: cat.categoryName,
        value: cat.value
      }));
      setStatusDistribution(distData);

      // 4. Generate Monthly Trend
      const trendData = (monthlyRevenue || []).map((item: any) => ({
        name: item.month,
        'Doanh thu': item.revenue,
        'Đơn hàng': item.orders
      }));
      setMonthlyTrend(trendData);

      // 5. Generate Top Selling Books
      const topBooksData = (topBooks || []).map((b: any, index: number) => ({
        title: b.title,
        sales: b.sold,
        // Backend DTO only returns bookId, title, sold. We mock revenue/category for UI display if needed
        revenue: (b.sold || 0) * 100000 // Approximate revenue if not provided
      }));
      setTopProducts(topBooksData);

    } catch (err: any) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err.message || 'Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-h-screen py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Đang tải số liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4 animate__animated animate__fadeIn">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">Tổng Quan Cửa Hàng</h1>
          <p className="text-muted mb-0">Theo dõi doanh thu, đơn hàng, khách hàng và hiệu suất bán hàng.</p>
        </div>
        <button
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
          className="btn btn-light border d-flex align-items-center gap-2 fw-bold text-secondary shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Tải lại dữ liệu
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger shadow-sm mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        {/* Doanh thu */}
        <div className="col-12 col-md-4">
          <Card className="border-0 shadow-sm h-100">
            <CardContent className="d-flex flex-column justify-content-between p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span className="text-muted text-uppercase font-semibold small">Doanh Thu (Năm)</span>
                  <h3 className="fw-bold mt-1 mb-0 text-dark">{formatCurrency(stats.totalRevenue)}</h3>
                </div>
                <div className="bg-primary-light p-2.5 rounded-3 text-danger">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="d-flex align-items-center gap-1 mt-auto">
                <span className={`d-flex align-items-center font-semibold text-sm ${stats.revenueGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.revenueGrowth >= 0 ? <TrendingUp className="w-4 h-4 me-0.5" /> : <TrendingDown className="w-4 h-4 me-0.5" />}
                  {formatGrowth(stats.revenueGrowth)}
                </span>
                <span className="text-muted text-xs">so với năm trước</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Đơn hàng */}
        <div className="col-12 col-md-4">
          <Card className="border-0 shadow-sm h-100">
            <CardContent className="d-flex flex-column justify-content-between p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span className="text-muted text-uppercase font-semibold small">Đơn Hàng (Năm)</span>
                  <h3 className="fw-bold mt-1 mb-0 text-dark">{stats.totalOrders.toLocaleString()}</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-2.5 rounded-3 text-info">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>
              <div className="d-flex align-items-center gap-1 mt-auto">
                <span className={`d-flex align-items-center font-semibold text-sm ${stats.ordersGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.ordersGrowth >= 0 ? <TrendingUp className="w-4 h-4 me-0.5" /> : <TrendingDown className="w-4 h-4 me-0.5" />}
                  {formatGrowth(stats.ordersGrowth)}
                </span>
                <span className="text-muted text-xs">so với năm trước</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Khách hàng */}
        <div className="col-12 col-md-4">
          <Card className="border-0 shadow-sm h-100">
            <CardContent className="d-flex flex-column justify-content-between p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span className="text-muted text-uppercase font-semibold small">Khách Hàng Mới</span>
                  <h3 className="fw-bold mt-1 mb-0 text-dark">{stats.totalCustomers.toLocaleString()}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-2.5 rounded-3 text-warning">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="d-flex align-items-center gap-1 mt-auto">
                <span className={`d-flex align-items-center font-semibold text-sm ${stats.customersGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.customersGrowth >= 0 ? <TrendingUp className="w-4 h-4 me-0.5" /> : <TrendingDown className="w-4 h-4 me-0.5" />}
                  {formatGrowth(stats.customersGrowth)}
                </span>
                <span className="text-muted text-xs">thành viên mới</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="row g-4 mb-4">
        {/* Doanh thu & Đơn hàng Chart */}
        <div className="col-12 col-lg-8">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="d-flex flex-row align-items-center justify-content-between py-3">
              <div>
                <CardTitle className="h5 mb-0 font-bold text-dark">Xu Hướng Bán Hàng (Năm Nay)</CardTitle>
                <CardDescription className="small text-muted">Biểu diễn doanh thu và khối lượng đơn hàng theo tháng</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c0392b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#c0392b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'Doanh thu') return [formatCurrency(value), name];
                      return [value, name];
                    }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area yAxisId="left" type="monotone" dataKey="Doanh thu" stroke="#c0392b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Bar yAxisId="right" dataKey="Đơn hàng" fill="#3182ce" radius={[4, 4, 0, 0]} barSize={25} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trạng thái đơn hàng Chart -> Changed to Doanh thu theo thể loại */}
        <div className="col-12 col-lg-4">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="py-3">
              <CardTitle className="h5 mb-0 font-bold text-dark">Doanh Thu Thể Loại</CardTitle>
              <CardDescription className="small text-muted">Tỷ lệ phần trăm doanh thu theo thể loại sách</CardDescription>
            </CardHeader>
            <CardContent className="d-flex flex-column align-items-center justify-content-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-100 mt-3 d-flex flex-wrap gap-2 justify-content-center text-xs">
                {statusDistribution.length === 0 && <span className="text-muted">Chưa có dữ liệu</span>}
                {statusDistribution.map((item, index) => (
                  <div key={index} className="d-flex align-items-center me-2 mb-1">
                    <div className="rounded-circle me-1.5" style={{ width: '10px', height: '10px', backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-muted">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 3: Recent Orders & Top Selling Books */}
      <div className="row g-4">
        {/* Recent Orders List */}
        <div className="col-12 col-lg-7">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="d-flex flex-row align-items-center justify-content-between py-3">
              <div>
                <CardTitle className="h5 mb-0 font-bold text-dark">Giao Dịch Gần Đây</CardTitle>
                <CardDescription className="small text-muted">Các đơn hàng vừa được thực hiện</CardDescription>
              </div>
              <Link href="/admin/orders" className="btn btn-sm btn-outline-primary fw-bold d-flex align-items-center gap-1">
                Xem tất cả
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Ngày đặt</th>
                      <th className="text-end">Thành tiền</th>
                      <th className="text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o, idx) => {
                      const dateStr = o.date
                        ? new Date(o.date).toLocaleDateString('vi-VN')
                        : '—';
                      return (
                        <tr key={idx}>
                          <td>
                            <span className="font-monospace fw-bold text-primary text-decoration-none">
                              {o.orderCode}
                            </span>
                          </td>
                          <td className="fw-semibold text-dark">{o.customerName || 'Khách vãng lai'}</td>
                          <td className="text-muted small">{dateStr}</td>
                          <td className="text-end fw-bold text-danger">{formatCurrency(o.amount || 0)}</td>
                          <td className="text-center">
                            <span className={`badge ${STATUS_BADGES[o.status] || 'bg-secondary'}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Chưa có đơn hàng nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Books */}
        <div className="col-12 col-lg-5">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="py-3">
              <CardTitle className="h5 mb-0 font-bold text-dark">Sách Bán Chạy (Top 5)</CardTitle>
              <CardDescription className="small text-muted">Những cuốn sách bán được nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="d-flex flex-column gap-3">
                {topProducts.length === 0 && (
                  <div className="text-center text-muted py-4">Chưa có dữ liệu sách bán chạy</div>
                )}
                {topProducts.map((p, idx) => (
                  <div key={idx} className="d-flex align-items-center justify-content-between p-2.5 bg-light rounded-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fs-5 fw-bold text-secondary" style={{ width: '24px' }}>#{idx + 1}</span>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark text-truncate" style={{ maxWidth: '200px' }} title={p.title}>{p.title}</h6>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold text-primary d-block">{p.sales} bản</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
