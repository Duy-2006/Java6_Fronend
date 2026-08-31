"use client";
import { isLoggedIn } from "@/lib/authFetch";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validatePromotion } from "@/services/validation";
import { createPromotion, updatePromotion } from "@/services/promotionServices";
import {
  Info, Sparkles, Calendar, Save, ChevronRight, Search, Globe, BookOpen, Layers, CheckCircle2, AlertCircle
} from "lucide-react";

interface Book { id: number; title: string }
interface Category { id: number; name: string }
interface Promotion {
  id?: number;
  name?: string;
  discountValue?: number | string;
  startDate?: string;
  endDate?: string;
  applyType?: string;
  usageLimit?: number | string;
  bookIds?: number[];
  categoryIds?: number[];
}

interface Props {
  promotion?: Promotion;
  books: Book[];
  categories: Category[];
  selectedBookIds?: number[];
  selectedCategoryIds?: number[];
}

export default function PromotionForm({
  promotion,
  books,
  categories,
  selectedBookIds = [],
  selectedCategoryIds = [],
}: Props) {
  const isEdit = !!promotion?.id;
  const router = useRouter();

  const [form, setForm] = useState({
    name: promotion?.name ?? "",
    discountValue: promotion?.discountValue ?? "",
    startDate: promotion?.startDate ?? "",
    endDate: promotion?.endDate ?? "",
    applyType: promotion?.applyType ?? "ALL",
    usageLimit: promotion?.usageLimit ?? "",
  });

  const [selBooks, setSelBooks] = useState<Set<number>>(new Set(selectedBookIds));
  const [selCats, setSelCats] = useState<Set<number>>(new Set(selectedCategoryIds));
  const [bookSearch, setBookSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validatePromotion>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [activePromoBookIds, setActivePromoBookIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchActivePromoBooks = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${API_URL}/api/books/flash-sale`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const ids = new Set<number>(data.map((b: any) => b.id));
            // Nếu đang sửa Khuyến mãi, không ẩn các sách thuộc chính Khuyến mãi này
            if (selectedBookIds && selectedBookIds.length > 0) {
              selectedBookIds.forEach(id => ids.delete(id));
            }
            setActivePromoBookIds(ids);
          }
        }
      } catch (err) {
        console.error("Error fetching flash sale books:", err);
      }
    };
    fetchActivePromoBooks();
  }, [selectedBookIds]);

  const set = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const toggle = (s: Set<number>, id: number) => {
    const n = new Set(s);
    if (n.has(id)) {
      n.delete(id);
    } else {
      n.add(id);
    }
    return n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const errs = validatePromotion({
      ...form,
      selBooks: selBooks.size,
      selCats: selCats.size
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }


    if (!isLoggedIn()) {
      setServerError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    try {
      const bookIds: number[] = form.applyType === "BOOK" ? Array.from(selBooks) : [];
      const categoryIds: number[] = form.applyType === "CATEGORY" ? Array.from(selCats) : [];
      const applyType = form.applyType as "ALL" | "BOOK" | "CATEGORY";

      const payload = {
        name: form.name,
        discountValue: Number(form.discountValue),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        applyType,
        status: true,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        bookIds,
        categoryIds,
      };

      if (isEdit) {
        await updatePromotion(promotion!.id!, payload);
      } else {
        await createPromotion(payload);
      }

      router.push("/admin/promotions");
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Có lỗi từ server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(b =>
    !activePromoBookIds.has(b.id) && b.title.toLowerCase().includes(bookSearch.toLowerCase())
  );
  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  // Format dates for preview
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "__/__/____";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const getPreviewBg = () => {
    if (form.applyType === "BOOK") return "from-blue-600 to-indigo-700 shadow-indigo-700/20";
    if (form.applyType === "CATEGORY") return "from-purple-600 to-fuchsia-700 shadow-fuchsia-700/20";
    return "from-[#b70011] to-[#8a000d] shadow-[#b70011]/20";
  };

  const getPreviewScope = () => {
    if (form.applyType === "BOOK") return `Áp dụng: ${selBooks.size} sách được chọn`;
    if (form.applyType === "CATEGORY") return `Áp dụng: ${selCats.size} thể loại được chọn`;
    return "Áp dụng: Toàn sàn (Tất cả sản phẩm)";
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 animate__animated animate__fadeIn font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">
            {isEdit ? "Chỉnh sửa Khuyến mãi" : "Tạo chương trình Khuyến mãi"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/promotions"
            className="px-5 py-2 border border-[#916f6b]/50 rounded-xl font-semibold text-xs text-[#5c403c] hover:bg-[#eceef0] transition-all cursor-pointer text-center"
          >
            Hủy
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-[#b70011] hover:bg-[#b70011]/90 text-white rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? "Lưu thay đổi" : "Tạo khuyến mãi"}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 text-sm font-sans">
          {serverError}
        </div>
      )}

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-6">
          {/* General Information Card */}
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e6bdb8]/10">
              <div className="p-2 bg-[#ffdad6] text-[#b70011] rounded-lg">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191c1e]">Thông tin chung</h3>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Tên khuyến mãi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="VD: Mừng Ngày Nhà Giáo Việt Nam"
                maxLength={100}
                className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
              <div className="text-right text-[10px] text-[#916f6b] mt-1">
                {form.name.length}/100 ký tự
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Mức giảm giá (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={e => set("discountValue", e.target.value)}
                  placeholder="VD: 25"
                  min={1}
                  max={50}
                  className={`w-full bg-slate-50 border ${errors.discountValue ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#916f6b]">
                  %
                </span>
              </div>
              {errors.discountValue && <p className="mt-1 text-xs text-red-600 font-medium">{errors.discountValue}</p>}
            </div>

            {/* Usage limit */}
            <div>
              <label className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Giới hạn số lượng (Lượt dùng tối đa)
              </label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={e => set("usageLimit", e.target.value)}
                placeholder="Để trống nếu không giới hạn"
                min={1}
                className={`w-full bg-slate-50 border ${errors.usageLimit ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
              />
              {errors.usageLimit && <p className="mt-1 text-xs text-red-600 font-medium">{errors.usageLimit}</p>}
            </div>

            {/* Apply Type Select */}
            <div>
              <label htmlFor="apply-type" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                Áp dụng cho
              </label>
              <select
                id="apply-type"
                title="Loại áp dụng"
                aria-label="Loại áp dụng"
                value={form.applyType}
                onChange={e => set("applyType", e.target.value)}
                className="w-full bg-slate-50 border border-[#e6bdb8]/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20 cursor-pointer"
              >
                <option value="ALL">Tất cả sách</option>
                <option value="BOOK">Theo sách</option>
                <option value="CATEGORY">Theo thể loại</option>
              </select>
              {errors.applyType && <p className="mt-2 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">{errors.applyType}</p>}
            </div>
          </div>

          {/* Card: Time Settings */}
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e6bdb8]/10">
              <div className="p-2 bg-[#ffdad6] text-[#b70011] rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#191c1e]">Thời gian áp dụng</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label htmlFor="start-date" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  id="start-date"
                  title="Ngày bắt đầu"
                  aria-label="Ngày bắt đầu"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.startDate}
                  onChange={e => set("startDate", e.target.value)}
                  className={`w-full bg-slate-50 border ${errors.startDate ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
                />
                {errors.startDate && <p className="mt-1 text-xs text-red-600 font-medium">{errors.startDate}</p>}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="end-date" className="block text-xs font-bold text-[#5c403c] mb-2 uppercase tracking-wide">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  id="end-date"
                  title="Ngày kết thúc"
                  aria-label="Ngày kết thúc"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.endDate}
                  onChange={e => set("endDate", e.target.value)}
                  className={`w-full bg-slate-50 border ${errors.endDate ? 'border-red-500' : 'border-[#e6bdb8]/50'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011]/20`}
                />
                {errors.endDate && <p className="mt-1 text-xs text-red-600 font-medium">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Promotion Card Ticket Live Preview */}
          <div className={`bg-gradient-to-br ${getPreviewBg()} p-6 rounded-2xl shadow-md text-white relative overflow-hidden group transition-all duration-300`}>
            {/* Circle backdrop pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none transition-transform duration-1000 group-hover:scale-110">
              <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="promoCircles" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="15" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#promoCircles)" />
              </svg>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold border border-white/30 backdrop-blur-sm">
                  {form.discountValue ? `GIẢM ${form.discountValue}%` : "KHUYẾN MÃI"}
                </div>
                <div className="text-[10px] uppercase font-semibold tracking-wider opacity-85">
                  Xem trước banner ưu đãi
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold truncate leading-tight">
                  {form.name || "Tên Chương Trình Khuyến Mãi"}
                </h4>
                <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Hạn dùng: {formatDate(form.startDate)} - {formatDate(form.endDate)}
                </p>
              </div>

              <div className="border-t border-white/20 pt-3 flex items-center justify-between text-[11px]">
                <span className="font-semibold">{getPreviewScope()}</span>
                <span className="opacity-75">
                  {form.usageLimit ? `Giới hạn: ${form.usageLimit} lượt` : "Không giới hạn số lượt"}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Right Column: Selections */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm min-h-[480px]">
            {/* Condition 1: ALL type */}
            {form.applyType === "ALL" && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[440px]">
                <div className="w-16 h-16 bg-[#ffdad6]/20 text-[#b70011] rounded-full flex items-center justify-center mb-4 border border-[#ffdad6]">
                  <Globe className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#191c1e] mb-2">Áp dụng toàn sách</h4>
                <p className="text-xs text-[#5c403c] max-w-md leading-relaxed">
                  Tất cả sản phẩm sách hiện có trên toàn bộ hệ thống cửa hàng Libris sẽ tự động được áp dụng mức giảm giá này trong khoảng thời gian diễn ra chiến dịch.
                </p>
                <div className="mt-6 text-[11px] text-[#916f6b] bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
                  Bạn không cần thiết lập danh sách sách hay thể loại áp dụng cho cấu hình này.
                </div>
              </div>
            )}

            {/* Condition 2: BOOK type */}
            {form.applyType === "BOOK" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6bdb8]/10">
                  <h4 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Danh sách sách áp dụng
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selBooks.size}
                    </span>
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelBooks(new Set(books.map(b => b.id)))}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Chọn tất cả ({books.length})
                    </button>
                    <span className="text-[#e6bdb8]/60">|</span>
                    <button
                      type="button"
                      onClick={() => setSelBooks(new Set())}
                      className="text-[#916f6b] hover:underline font-semibold cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-[#916f6b]" />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm tên sách..."
                    value={bookSearch}
                    onChange={e => setBookSearch(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-[#e6bdb8]/50 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b70011]/15 focus:border-[#b70011] transition-all bg-slate-50 hover:bg-white text-[#191c1e]"
                  />
                </div>

                {/* Book Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredBooks.map(b => {
                    const isSelected = selBooks.has(b.id);
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelBooks(toggle(selBooks, b.id));
                          setErrors(v => ({ ...v, applyType: undefined }));
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isSelected
                            ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-medium'
                            : 'border-[#e6bdb8]/20 bg-slate-50 hover:bg-white hover:border-blue-300'
                          }`}
                      >
                        <input
                          id={`book-${b.id}`}
                          title={`Chọn sách ${b.title}`}
                          aria-label={`Chọn sách ${b.title}`}
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-blue-600 border-[#e6bdb8] rounded focus:ring-blue-500 pointer-events-none"
                        />
                        <label htmlFor={`book-${b.id}`} className="text-xs truncate cursor-pointer" title={b.title}>{b.title}</label>
                      </div>
                    );
                  })}
                  {filteredBooks.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-[#916f6b]">
                      Không tìm thấy sách nào phù hợp với từ khóa
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Condition 3: CATEGORY type */}
            {form.applyType === "CATEGORY" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6bdb8]/10">
                  <h4 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Danh sách thể loại áp dụng
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selCats.size}
                    </span>
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelCats(new Set(categories.map(c => c.id)))}
                      className="text-purple-600 hover:underline font-semibold cursor-pointer"
                    >
                      Chọn tất cả ({categories.length})
                    </button>
                    <span className="text-[#e6bdb8]/60">|</span>
                    <button
                      type="button"
                      onClick={() => setSelCats(new Set())}
                      className="text-[#916f6b] hover:underline font-semibold cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-[#916f6b]" />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm tên thể loại..."
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-[#e6bdb8]/50 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b70011]/15 focus:border-[#b70011] transition-all bg-slate-50 hover:bg-white text-[#191c1e]"
                  />
                </div>

                {/* Category Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredCats.map(c => {
                    const isSelected = selCats.has(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelCats(toggle(selCats, c.id));
                          setErrors(v => ({ ...v, applyType: undefined }));
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isSelected
                            ? 'border-purple-500 bg-purple-50/50 text-purple-900 font-medium'
                            : 'border-[#e6bdb8]/20 bg-slate-50 hover:bg-white hover:border-purple-300'
                          }`}
                      >
                        <input
                          id={`cat-${c.id}`}
                          title={`Chọn thể loại ${c.name}`}
                          aria-label={`Chọn thể loại ${c.name}`}
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 text-purple-600 border-[#e6bdb8] rounded focus:ring-purple-500 pointer-events-none"
                        />
                        <label htmlFor={`cat-${c.id}`} className="text-xs truncate cursor-pointer" title={c.name}>{c.name}</label>
                      </div>
                    );
                  })}
                  {filteredCats.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-[#916f6b]">
                      Không tìm thấy thể loại nào phù hợp với từ khóa
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}