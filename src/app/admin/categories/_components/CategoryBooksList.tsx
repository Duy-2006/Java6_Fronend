'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ArrowUpDown, 
  BookOpen, 
  Coins, 
  Package, 
  Sparkles,
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Book {
  id: number;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  authorName?: string;
  active: boolean;
  audioPrice?: number;
  soldCount?: number;
}

interface CategoryBooksListProps {
  books: Book[];
  categoryName: string;
  baseUrl: string;
}

export default function CategoryBooksList({ books = [], categoryName, baseUrl }: CategoryBooksListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'price-asc' | 'price-desc' | 'quantity' | 'sold'>('title');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const getBookImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60";
    if (imageUrl.startsWith("http")) return imageUrl;
    let clean = imageUrl;
    if (clean.startsWith("books/")) clean = clean.substring(6);
    if (clean.startsWith("book/")) clean = clean.substring(5);
    return `${baseUrl}/uploads/books/${clean}`;
  };

  // 1. Stats Calculations
  const stats = useMemo(() => {
    const total = books.length;
    const totalStock = books.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const avgPrice = total > 0 ? Math.round(books.reduce((sum, b) => sum + (b.price || 0), 0) / total) : 0;
    const totalSold = books.reduce((sum, b) => sum + (b.soldCount || 0), 0);
    return { total, totalStock, avgPrice, totalSold };
  }, [books]);

  // 2. Filter & Sort Logic
  const processedBooks = useMemo(() => {
    let result = [...books];

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(q) || 
        (b.authorName && b.authorName.toLowerCase().includes(q))
      );
    }

    // Filter by active status
    if (filterActive !== 'all') {
      const targetActive = filterActive === 'active';
      result = result.filter(b => b.active === targetActive);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'quantity':
          return b.quantity - a.quantity;
        case 'sold':
          return (b.soldCount || 0) - (a.soldCount || 0);
        case 'title':
        default:
          return a.title.localeCompare(b.title, 'vi');
      }
    });

    return result;
  }, [books, searchTerm, sortBy, filterActive]);

  return (
    <div className="space-y-8">
      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-slate-50/50 p-5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <BookOpen className="w-24 h-24 text-slate-900" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tựa sách</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Tác phẩm lưu trữ</p>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50/50 p-5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Package className="w-24 h-24 text-slate-900" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tồn kho</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.totalStock}</p>
          <p className="text-xs text-slate-400 mt-1">Cuốn khả dụng</p>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50/50 p-5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Coins className="w-24 h-24 text-slate-900" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá trung bình</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('vi-VN').format(stats.avgPrice)}đ</p>
          <p className="text-xs text-slate-400 mt-1">Đơn giá ước tính</p>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50/50 p-5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <ShoppingBag className="w-24 h-24 text-slate-900" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã bán ra</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.totalSold}</p>
          <p className="text-xs text-slate-400 mt-1">Giao dịch thành công</p>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sách hoặc tác giả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-[#b70011]/20 focus:border-[#b70011] transition-all outline-none"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Active Status Filter */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${filterActive === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Tất cả ({books.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${filterActive === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Đang bán ({books.filter(b => b.active).length})
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${filterActive === 'inactive' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Tạm ẩn ({books.filter(b => !b.active).length})
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative flex items-center gap-1.5 border border-slate-200 rounded-lg bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none outline-none font-semibold cursor-pointer pr-1"
            >
              <option value="title">Tên sách A-Z</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="quantity">Tồn kho nhiều nhất</option>
              <option value="sold">Bán chạy nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Book Grid View */}
      {processedBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {processedBooks.map((book) => (
            <Link 
              key={book.id} 
              href={`/admin/books/${book.id}`}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
            >
              {/* Cover Art Image Wrapper */}
              <div className="aspect-[3/4] bg-slate-50 overflow-hidden relative flex items-center justify-center p-4 border-b border-slate-100">
                <img 
                  src={getBookImageUrl(book.imageUrl)} 
                  alt={book.title} 
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 filter drop-shadow-md"
                />
                
                {/* Overlay Tags */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {book.active ? (
                    <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                      Active
                    </span>
                  ) : (
                    <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                      Hidden
                    </span>
                  )}
                  {book.soldCount && book.soldCount > 10 ? (
                    <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> Best
                    </span>
                  ) : null}
                </div>

                <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-100">
                  Kho: {book.quantity}
                </div>
              </div>

              {/* Card Metadata Details */}
              <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px] group-hover:text-[#b70011] transition-colors leading-tight" title={book.title}>
                    {book.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">{book.authorName || 'Chưa rõ tác giả'}</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold">Giá bán</span>
                    <span className="text-xs font-black text-[#b70011]">
                      {new Intl.NumberFormat('vi-VN').format(book.price)}đ
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#b70011] group-hover:text-white transition-all duration-300">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-slate-600 font-bold text-base">Không tìm thấy sách nào</p>
          <p className="text-slate-400 text-sm max-w-sm mt-1">
            Không tìm thấy tựa sách nào khớp với từ khóa tìm kiếm hoặc điều kiện lọc hiện tại.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setFilterActive('all'); }}
            className="mt-4 text-xs font-bold text-[#b70011] bg-red-50 px-4 py-2 rounded-lg border border-red-100 hover:bg-[#b70011] hover:text-white transition-all"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
