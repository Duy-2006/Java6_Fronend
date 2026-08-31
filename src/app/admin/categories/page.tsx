'use client';

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getAllCategories } from "@/services/categoriesService";
import DeleteCategoryButton from "@/app/admin/categories/_components/DeleteCategoryButton";
import {
  Grid,
  List,
  Search,
  Plus,
  Edit,
  Download,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
  FolderKanban,
  BookOpen
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

function CategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) setAlert({ msg: success, type: 'success' });
    if (error) setAlert({ msg: error, type: 'error' });
    if (success || error) {
      window.history.replaceState(null, '', '/admin/categories');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const loadCategories = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(false);

    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      setAlert({ msg: "Không thể tải danh sách thể loại.", type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl}`;
  };

  // Vietnamese Slug generator
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Thematic fallback cover images based on category name
  const getCategoryFallbackImage = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes("van hoc") || lowercaseName.includes("tieu thuyet") || lowercaseName.includes("co dien")) {
      return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60";
    }
    if (lowercaseName.includes("khoa hoc") || lowercaseName.includes("ky thuat") || lowercaseName.includes("cong nghe")) {
      return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60";
    }
    if (lowercaseName.includes("nghe thuat") || lowercaseName.includes("sang tao") || lowercaseName.includes("thiet ke")) {
      return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=60";
    }
    if (lowercaseName.includes("ky nang") || lowercaseName.includes("tam ly") || lowercaseName.includes("phat trien")) {
      return "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=60";
    }
    if (lowercaseName.includes("kinh te") || lowercaseName.includes("tai chinh") || lowercaseName.includes("doanh nghiep")) {
      return "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60";
    }
    return "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&auto=format&fit=crop&q=60";
  };

  // Custom descriptions to make the cards look beautiful and high density
  const getCategoryDescription = (name: string) => {
    return `Các tác phẩm sách và tài liệu nghiên cứu thuộc chủ đề ${name} được tuyển chọn và cập nhật liên tục từ các tác giả tên tuổi trong nước và quốc tế.`;
  };

  // Client-side search filtering
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, viewMode]);

  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  // Export categories to Excel using SheetJS
  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');

      const dataToExport = categories.map(cat => ({
        'ID': cat.id,
        'Tên Thể Loại': cat.name,
        'Slug': generateSlug(cat.name),
        'Số lượng sách': cat.books?.length ?? 0,
        'Trạng thái': 'Hoạt động'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Thể loại');

      XLSX.writeFile(wb, `Danh_sach_the_loai_Libris_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      console.error('Error exporting categories:', err);
      setAlert({ msg: 'Không thể xuất file báo cáo: ' + err.message, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải danh sách thể loại...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto p-4 animate__animated animate__fadeIn font-sans">

      {/* Alert Banners */}
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

      {/* Header & Stats section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">

          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Quản lý Thể loại</h2>

        </div>

        {/* Total Categories Stat Card */}
        <div className="bg-white border border-[#e6bdb8]/30 p-4 rounded-xl flex items-center gap-4 min-w-[240px] shadow-sm">
          <div className="w-12 h-12 bg-[#ffdad6] text-[#b70011] rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider">Tổng số thể loại</p>
            <p className="text-2xl font-bold text-[#191c1e]">
              {categories.length} <span className="text-sm font-normal text-slate-500 ml-1">Danh mục</span>
            </p>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e6bdb8]/20 shadow-sm">
        {/* Left Actions: Search, Filter, Export, View Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div style={{ position: "relative" }} className="w-full sm:w-64">
            <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} className="w-4 h-4 text-slate-400" />
            <input
              type="search"
              style={{ paddingLeft: "2.5rem" }}
              placeholder="Tìm kiếm thể loại..."
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

        {/* Right Actions: Add New Button */}
        <Link
          href="/admin/categories/new"
          className="w-full sm:w-auto bg-[#b70011] text-white px-5 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#b70011]/15 hover:bg-[#b70011]/90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm thể loại mới</span>
        </Link>
      </div>

      {/* Categories Content Grid / Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedCategories.map((item) => {
            const imgSrc = getImageUrl(item.imageUrl);
            return (
              <div
                key={item.id}
                className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between cursor-pointer hover:border-[#b70011]/30"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.action-button')) return;
                  router.push(`/admin/categories/${item.id}`);
                }}
              >
                <div>
                  <div className="h-40 relative overflow-hidden bg-slate-100">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={imgSrc || getCategoryFallbackImage(item.name)}
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCategoryFallbackImage(item.name);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="bg-[#b70011] px-3 py-1 rounded-full text-white text-[11px] font-bold tracking-wide uppercase">
                        {item.books?.length ?? 0} Sách
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-800 group-hover:text-[#b70011] transition-colors truncate" title={item.name}>{item.name}</h3>
                        <p className="text-xs font-mono text-[#916f6b] truncate mt-0.5">{generateSlug(item.name)}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 action-button">
                        <Link
                          href={`/admin/categories/${item.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                          title="Chỉnh sửa"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </Link>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DeleteCategoryButton categoryId={item.id} />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {getCategoryDescription(item.name)}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className="text-[#b70011] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#b70011]">L</div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">A</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bento Add New Placeholder */}
          <Link
            href="/admin/categories/new"
            className="border-2 border-dashed border-[#e6bdb8]/50 hover:border-[#b70011] rounded-xl flex flex-col items-center justify-center p-6 bg-slate-50/50 hover:bg-red-50/20 group cursor-pointer transition-all duration-300 min-h-[310px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#ffdad6] group-hover:text-[#b70011] text-slate-500 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 group-hover:text-[#b70011] transition-colors">Thêm thể loại mới</p>
            <p className="text-xs text-slate-400 text-center mt-1.5 max-w-[200px]">
              Mở rộng danh mục sách của Libris bằng cách thêm các thể loại mới.
            </p>
          </Link>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-[#e6bdb8]/30 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#e6bdb8]/20 bg-slate-50/50 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">Danh sách chi tiết</h4>
            <span className="text-xs text-slate-500">Hiển thị {paginatedCategories.length} trên tổng {filteredCategories.length} thể loại</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e6bdb8]/20 text-xs font-bold text-[#916f6b] uppercase tracking-wider">
                  <th className="px-6 py-4">Thể loại</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Số lượng sách</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Trạng thái</th>
                  <th className="px-6 py-4" style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdb8]/10">
                {paginatedCategories.map((item) => {
                  const imgSrc = getImageUrl(item.imageUrl);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#b70011]/5 transition-colors duration-150 group cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('.action-button')) return;
                        router.push(`/admin/categories/${item.id}`);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            <img
                              className="w-full h-full object-cover"
                              src={imgSrc || getCategoryFallbackImage(item.name)}
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getCategoryFallbackImage(item.name);
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-[#b70011] transition-colors">{item.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-700" style={{ textAlign: "center" }}>
                        {item.books?.length ?? 0}
                      </td>
                      <td className="px-6 py-4" style={{ textAlign: "center" }}>
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                          Hoạt động
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ textAlign: "center" }}>
                        <div className="flex justify-center items-center gap-1.5 action-button">
                          <Link
                            href={`/admin/categories/${item.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors border border-slate-200/60"
                            title="Chỉnh sửa"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </Link>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DeleteCategoryButton categoryId={item.id} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">
                      Không tìm thấy thể loại nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white border border-[#e6bdb8]/30 rounded-xl p-4 shadow-sm">
          <span className="text-sm text-slate-500 font-medium">
            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} của {totalItems} thể loại
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-bold cursor-pointer transition-colors ${currentPage === page
                  ? "bg-[#b70011] text-white border-[#b70011]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải trang...</p>
      </div>
    }>
      <CategoriesContent />
    </Suspense>
  );
}
