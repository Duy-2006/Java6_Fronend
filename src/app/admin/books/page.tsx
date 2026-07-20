'use client';

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getAllBooks } from "@/services/booksService";
import DeleteBookButton from "./_components/DeleteBookButton";
import RestoreBookButton from "./_components/RestoreBookButton";
import {
  Grid,
  List,
  Search,
  Plus,
  Edit,
  Download,
  RefreshCw,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Layers,
  EyeOff,
  Package,
  BookMarked
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

function BooksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Clear query parameters and show alerts
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) setAlert({ msg: success, type: 'success' });
    if (error) setAlert({ msg: error, type: 'error' });
    if (success || error) {
      window.history.replaceState(null, '', '/admin/books');
    }
  }, [searchParams, router]);

  // Auto hide alerts
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const loadBooks = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAllBooks();
      setBooks(data);
    } catch (err) {
      setAlert({ msg: "Không thể tải danh sách sách.", type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const getCorrectImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60";
    if (imageUrl.startsWith("http")) return imageUrl;
    let clean = imageUrl;
    if (clean.startsWith("books/")) clean = clean.substring(6);
    if (clean.startsWith("book/")) clean = clean.substring(5);
    return `${API_URL}/uploads/books/${clean}`;
  };

  // Client-side search filtering
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.isbn && book.isbn.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (book.authorNames && book.authorNames.some((name: string) => name.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    ((book.authorName || book.author?.name) && (book.authorName || book.author?.name).toLowerCase().includes(searchQuery.toLowerCase())) ||
    ((book.categoryName || book.category?.name) && (book.categoryName || book.category?.name).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Export books to Excel using SheetJS
  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');

      const dataToExport = books.map(book => ({
        'Mã Sách': book.id,
        'ISBN': book.isbn || 'N/A',
        'Tên Sách': book.title,
        'Tác Giả': (book.authorNames && book.authorNames.length > 0) ? book.authorNames.join(", ") : (book.authorName || book.author?.name || '(Chưa cập nhật)'),
        'Thể Loại': book.categoryName || book.category?.name || '(Chưa cập nhật)',
        'Đơn Giá (đ)': book.price,
        'Số Lượng Tồn': book.quantity,
        'Trạng Thái': book.active ? 'Đang kinh doanh' : 'Đang tạm ẩn'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách sách');

      XLSX.writeFile(wb, `Danh_sach_sach_Libris_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Error exporting books:', err);
      setAlert({ msg: 'Không thể xuất file báo cáo: ' + err.message, type: 'error' });
    }
  };

  // Summary Metrics
  const totalCopies = books.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const activeBooks = books.filter(b => b.active).length;
  const lowStockBooks = books.filter(b => b.quantity <= 10 && b.quantity > 0 && b.active).length;
  const outOfStockBooks = books.filter(b => b.quantity === 0 && b.active).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải danh sách sách...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">

      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown transition-all ${alert.type === 'success'
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <p className="text-sm font-semibold">{alert.msg}</p>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold leading-none cursor-pointer"
            onClick={() => setAlert(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#b70011]">Kho sách</span>
          </nav>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Quản lý Sách</h2>
        </div>
        <Link
          href="/admin/books/new"
          className="w-full sm:w-auto bg-[#b70011] text-white px-5 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#b70011]/15 hover:bg-[#b70011]/90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nhập sách mới</span>
        </Link>
      </section>

      {/* Bento Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Books */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-4 group hover:border-[#b70011] transition-all duration-300">
          <div className="w-12 h-12 bg-[#ffdad6] text-[#b70011] rounded-full flex items-center justify-center group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-0.5">Tổng số sách</p>
            <h3 className="text-xl font-bold text-[#191c1e] leading-tight">
              {new Intl.NumberFormat("vi-VN").format(totalCopies)} <span className="text-xs font-normal text-slate-400">bản</span>
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Từ {books.length} đầu sách
            </p>
          </div>
        </div>

        {/* Active Trading */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-4 group hover:border-[#b70011] transition-all duration-300">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-emerald-800 uppercase tracking-widest mb-0.5">Đang kinh doanh</p>
            <h3 className="text-xl font-bold text-[#191c1e] leading-tight">
              {activeBooks} <span className="text-xs font-normal text-slate-400">đầu sách</span>
            </h3>
            <p className="text-xs font-medium text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đang hoạt động bán hàng
            </p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-4 group hover:border-[#b70011] transition-all duration-300">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-amber-800 uppercase tracking-widest mb-0.5">Sắp hết hàng</p>
            <h3 className="text-xl font-bold text-[#191c1e] leading-tight">
              {lowStockBooks} <span className="text-xs font-normal text-slate-400">đầu sách</span>
            </h3>
            <p className="text-xs font-medium text-amber-600 mt-0.5">
              Tồn kho dưới 10 bản
            </p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-4 group hover:border-[#b70011] transition-all duration-300">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-red-800 uppercase tracking-widest mb-0.5">Hết hàng kinh doanh</p>
            <h3 className="text-xl font-bold text-[#191c1e] leading-tight">
              {outOfStockBooks} <span className="text-xs font-normal text-slate-400">đầu sách</span>
            </h3>
            <p className="text-xs font-medium text-red-600 mt-0.5">
              Cần nhập thêm sách mới
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e6bdb8]/20 shadow-sm">
        {/* Search, Filter, Export, View Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Tìm kiếm sách, tác giả, thể loại..."
              className="w-full bg-[#f2f4f6]/80 border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 transition-all outline-none"
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
            onClick={() => loadBooks(true)}
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

      {/* Grid or Table display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedBooks.map((book) => {
            const priceFormatted = new Intl.NumberFormat("vi-VN").format(book.price);
            return (
              <div 
                key={book.id} 
                className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between cursor-pointer hover:border-[#b70011]/30"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.action-button')) return;
                  router.push(`/admin/books/${book.id}`);
                }}
              >
                <div className="block text-inherit flex-grow">
                  <div className="h-56 relative overflow-hidden bg-slate-100 flex items-center justify-center p-3">
                    <img
                      className="max-h-full max-w-full object-contain rounded-md shadow-md group-hover:scale-105 transition-transform duration-500"
                      src={getCorrectImageUrl(book.imageUrl)}
                      alt={book.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60";
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {book.active ? (
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm">
                          Đang bán
                        </span>
                      ) : (
                        <span className="bg-slate-400 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm">
                          Đã ẩn
                        </span>
                      )}
                      {book.quantity === 0 && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm animate-pulse">
                          Hết hàng
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#b70011] transition-colors line-clamp-2 min-h-[40px] leading-tight" title={book.title}>
                        {book.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-400">Giá bán</p>
                    <p className="text-sm font-bold text-[#b70011]">{priceFormatted}đ</p>
                  </div>

                  <div className="flex items-center gap-1.5 action-button">
                    <Link
                      href={`/admin/books/${book.id}/edit`}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                      title="Chỉnh sửa"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <div onClick={(e) => e.stopPropagation()}>
                      {book.active ? (
                        <DeleteBookButton bookId={book.id} onSuccess={() => { setAlert({ msg: "Đã ẩn sách thành công.", type: 'success' }); loadBooks(true); }} />
                      ) : (
                        <RestoreBookButton bookId={book.id} onSuccess={() => { setAlert({ msg: "Đã bật sách thành công.", type: 'success' }); loadBooks(true); }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bento Add New Placeholder */}
          <Link
            href="/admin/books/new"
            className="border-2 border-dashed border-[#e6bdb8]/50 hover:border-[#b70011] rounded-xl flex flex-col items-center justify-center p-6 bg-slate-50/50 hover:bg-red-50/20 group cursor-pointer transition-all duration-300 min-h-[340px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#ffdad6] group-hover:text-[#b70011] text-slate-500 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 group-hover:text-[#b70011] transition-colors">Nhập sách mới</p>
            <p className="text-xs text-slate-400 text-center mt-1.5 max-w-[200px]">
              Bổ sung thêm các tác phẩm, đầu sách mới vào cơ sở dữ liệu của hệ thống.
            </p>
          </Link>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e6bdb8]/20 text-xs font-bold text-[#916f6b] uppercase tracking-wider">
                  <th className="px-6 py-4 w-[100px]">Bìa</th>
                  <th className="px-6 py-4">Tên sách</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Giá</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Tồn kho</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Trạng thái</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10">
                {paginatedBooks.map((book) => {
                  const priceFormatted = new Intl.NumberFormat("vi-VN").format(book.price);
                  return (
                    <tr 
                      key={book.id} 
                      className="hover:bg-[#b70011]/5 transition-colors duration-150 group cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.action-button')) return;
                        router.push(`/admin/books/${book.id}`);
                      }}
                    >
                      <td className="px-6 py-3">
                        <div className="block w-12 h-16 rounded-md overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-200/50 flex-shrink-0 group-hover:border-[#b70011] transition-all">
                          <img
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            src={getCorrectImageUrl(book.imageUrl)}
                            alt={book.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60";
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-[#b70011] transition-colors">{book.title}</p>
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-[#b70011]" style={{ textAlign: "center" }}>
                        {priceFormatted}đ
                      </td>
                      <td className="px-6 py-3" style={{ textAlign: "center" }}>
                        {book.quantity > 10 ? (
                          <span className="inline-flex items-center justify-center bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-bold min-w-[40px]">
                            {book.quantity}
                          </span>
                        ) : book.quantity > 0 ? (
                          <span className="inline-flex items-center gap-1 justify-center bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold min-w-[40px]" title="Sắp hết hàng">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {book.quantity}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-bold min-w-[40px]">
                            Hết hàng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3" style={{ textAlign: "center" }}>
                        {book.active ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                            Đang bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tạm ẩn
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3" style={{ textAlign: "center" }}>
                        <div className="flex justify-center items-center gap-1.5 action-button">
                          <Link
                            href={`/admin/books/${book.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                            title="Chỉnh sửa"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <div onClick={(e) => e.stopPropagation()}>
                            {book.active ? (
                              <DeleteBookButton bookId={book.id} onSuccess={() => { setAlert({ msg: "Đã ẩn sách thành công.", type: 'success' }); loadBooks(true); }} />
                            ) : (
                              <RestoreBookButton bookId={book.id} onSuccess={() => { setAlert({ msg: "Đã bật sách thành công.", type: 'success' }); loadBooks(true); }} />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredBooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                      Không tìm thấy sách nào phù hợp.
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
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredBooks.length)} của {filteredBooks.length} sách
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

      {/* Sticky Footer */}
      <footer className="py-6 text-center border-t border-slate-100">
        <p className="text-[10px] text-[#916f6b] font-bold uppercase tracking-widest">
          © 2026 Libris Management System. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải trang...</p>
      </div>
    }>
      <BooksContent />
    </Suspense>
  );
}