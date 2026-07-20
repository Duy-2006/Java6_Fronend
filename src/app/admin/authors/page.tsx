'use client';

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getAllAuthors } from "@/services/authorsService";
import DeleteAuthorButton from "./_components/DeleteAuthorButton";
import { 
  Grid, 
  List, 
  Search, 
  Plus, 
  Edit, 
  Download, 
  Filter, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  Users,
  TrendingUp,
  Star,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Mail,
  UserPlus
} from "lucide-react";

function AuthorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Đọc thông báo từ URL khi mount
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) setAlert({ msg: success, type: 'success' });
    if (error) setAlert({ msg: error, type: 'error' });
    // Xóa params khỏi URL để không hiện lại khi refresh
    if (success || error) {
      window.history.replaceState(null, '', '/admin/authors');
    }
  }, [searchParams, router]);

  // Tự động ẩn thông báo sau 3 giây
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const loadAuthors = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAllAuthors();
      setAuthors(data);
    } catch (err) {
      setAlert({ msg: "Không thể tải danh sách tác giả.", type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tải danh sách tác giả
  useEffect(() => {
    loadAuthors();
  }, []);

  // Lọc tác giả theo truy vấn tìm kiếm
  const filteredAuthors = authors.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    String(item.id).includes(searchQuery)
  );

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(filteredAuthors.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuthors = filteredAuthors.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Xuất danh sách tác giả sang Excel sử dụng SheetJS
  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const dataToExport = authors.map(item => ({
        'ID': item.id,
        'Tên Tác Giả': item.name,
        'Email': item.email || '(Chưa cập nhật)',
        'Số lượng sách': item.bookCount ?? 0,
        'Trạng thái': (item.bookCount && item.bookCount > 0) ? 'Đang hoạt động' : 'Tạm ngưng'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tác giả');
      
      XLSX.writeFile(wb, `Danh_sach_tac_gia_Libris_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Error exporting authors:', err);
      setAlert({ msg: 'Không thể xuất file báo cáo: ' + err.message, type: 'error' });
    }
  };



  // Tìm tác giả nổi bật nhất
  const popularAuthor = [...authors].sort((a, b) => (b.bookCount || 0) - (a.bookCount || 0))[0] || {
    name: "Haruki Murakami",
    id: "8274",
    bookCount: 32
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải danh sách tác giả...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">
      {/* Thông báo */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate__animated animate__fadeInDown transition-all ${
          alert.type === 'success' 
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

      {/* Tiêu đề & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#b70011]">Tác giả</span>
          </nav>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Quản lý Tác giả</h2>
        </div>
        <Link 
          href="/admin/authors/new"
          className="w-full sm:w-auto bg-[#b70011] text-white px-5 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#b70011]/15 hover:bg-[#b70011]/90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm tác giả mới</span>
        </Link>
      </section>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card Tổng số tác giả */}
        <div className="md:col-span-4 bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center gap-5 group hover:border-[#b70011] transition-colors duration-300">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#b70011] group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Tổng số tác giả</p>
            <h3 className="text-2xl font-bold text-[#191c1e] leading-none">{authors.length}</h3>
            <p className="font-semibold text-xs text-[#b70011] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              +12 trong tháng này
            </p>
          </div>
        </div>

        {/* Card Tác giả nổi bật */}
        <div className="md:col-span-8 bg-white p-5 rounded-xl border border-[#e6bdb8]/30 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-[#b70011] transition-colors duration-300">
          <div className="flex items-center gap-5 relative z-10">
            <div>
              <p className="font-bold text-[10px] text-[#916f6b] uppercase tracking-widest mb-1">Tác giả nổi bật nhất</p>
              <h3 className="text-lg font-bold text-[#191c1e]">{popularAuthor.name}</h3>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="bg-[#d5e0f8] text-[#586377] px-3 py-1 rounded-full text-[10px] font-bold">
                  {popularAuthor.bookCount ?? 0} Tác phẩm
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  4.9 Rating
                </span>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-red-50/20 to-transparent flex items-center justify-end pr-6 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
            <BookOpen className="w-24 h-24 text-[#b70011]/5" />
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
              type="search" 
              placeholder="Tìm kiếm tác giả..."
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
            onClick={() => loadAuthors(true)}
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

      {/* Grid or Table Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedAuthors.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between p-5 space-y-4 cursor-pointer hover:border-[#b70011]/30"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.action-button')) return;
                router.push(`/admin/authors/${item.id}`);
              }}
            >
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm font-bold text-slate-800 group-hover:text-[#b70011] transition-colors line-clamp-1">
                    {item.name}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{item.email || '(Chưa cập nhật email)'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 bg-[#f2f4f6] border border-slate-200/50 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-600">
                  {item.bookCount ?? 0} Sách
                </span>

                <div className="flex items-center gap-1.5 action-button">
                  <Link 
                    href={`/admin/authors/${item.id}/edit`}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                    title="Chỉnh sửa"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="w-4.5 h-4.5" />
                  </Link>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DeleteAuthorButton authorId={item.id} onSuccess={() => loadAuthors(true)} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Bento Add New Placeholder */}
          <Link 
            href="/admin/authors/new" 
            className="border-2 border-dashed border-[#e6bdb8]/50 hover:border-[#b70011] rounded-xl flex flex-col items-center justify-center p-6 bg-slate-50/50 hover:bg-red-50/20 group cursor-pointer transition-all duration-300 min-h-[170px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#ffdad6] group-hover:text-[#b70011] text-slate-500 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 group-hover:text-[#b70011] transition-colors">Thêm tác giả mới</p>
            <p className="text-xs text-slate-400 text-center mt-1.5 max-w-[200px]">
              Mở rộng hệ thống bằng cách thêm tác giả mới.
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
                  <th className="px-6 py-4">Tác giả</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Số lượng sách</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Trạng thái</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10">
                {paginatedAuthors.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-[#b70011]/5 transition-colors duration-150 group cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.action-button')) return;
                      router.push(`/admin/authors/${item.id}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-bold text-slate-800 group-hover:text-[#b70011] transition-colors">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ textAlign: "center" }}>
                      <span className="text-sm font-semibold text-slate-600">{item.bookCount ?? 0} tác phẩm</span>
                    </td>
                    <td className="px-6 py-4" style={{ textAlign: "center" }}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        (item.bookCount && item.bookCount > 0)
                          ? 'bg-green-50 text-green-800 border-green-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (item.bookCount && item.bookCount > 0) ? 'bg-green-600 animate-pulse' : 'bg-slate-400'
                        }`} />
                        {(item.bookCount && item.bookCount > 0) ? 'Đang hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ textAlign: "center" }}>
                      <div className="flex justify-center items-center gap-1.5 action-button">
                        <Link 
                          href={`/admin/authors/${item.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                          title="Chỉnh sửa"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </Link>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DeleteAuthorButton authorId={item.id} onSuccess={() => loadAuthors(true)} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAuthors.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-400 py-12 text-sm">
                      Không tìm thấy tác giả nào phù hợp.
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
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAuthors.length)} của {filteredAuthors.length} tác giả
          </p>
          <div className="flex items-center gap-1.5">
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              title="Trang trước"
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
              title="Trang sau"
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

export default function AuthorsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải trang...</p>
      </div>
    }>
      <AuthorsContent />
    </Suspense>
  );
}