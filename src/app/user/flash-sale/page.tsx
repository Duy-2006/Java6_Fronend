"use client";
import { useEffect, useState } from "react";
import BookCard from "@/components/BookCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function FlashSalePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const response = await fetch(`${API_URL}/api/books/flash-sale`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        let fBooks = Array.isArray(data) ? data : [];
        fBooks = fBooks.filter((b: any) => b.active !== false);
        
        // Sắp xếp: Giảm giá cao nhất -> Bán nhiều nhất
        fBooks.sort((a: any, b: any) => {
           const aDiscount = Number(a.discountValue) || 0;
           const bDiscount = Number(b.discountValue) || 0;
           if (bDiscount !== aDiscount) return bDiscount - aDiscount;
           const aSold = Number(a.soldCount) || 0;
           const bSold = Number(b.soldCount) || 0;
           return bSold - aSold;
        });

        setBooks(fBooks);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSale();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#b70011] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-[50vh] flex items-center justify-center">
        Đã có lỗi xảy ra: {error}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="bg-[#f25841] rounded-[16px] p-6 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
            <span className="italic font-black tracking-tighter flex items-center">
              FL<span className="material-symbols-outlined text-[#ffc107] text-[40px] mx-[-4px] fill-1" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>SH SALE
            </span>
          </h1>
          <p className="mt-2 text-white/90 text-sm md:text-base max-w-2xl">
            Tất cả các tựa sách đang được áp dụng chương trình khuyến mãi hấp dẫn nhất trên hệ thống. 
            Nhanh tay mua ngay trước khi chương trình kết thúc!
          </p>
        </div>

        {/* Grid Sách */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {books.map(book => (
              <BookCard key={book.id} b={book} onAddToCart={() => {}} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[20px] text-center shadow-sm">
            <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4 block">
              mood_bad
            </span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Không có sách khuyến mãi nào</h3>
            <p className="text-gray-500">Hiện tại chưa có chương trình Flash Sale nào diễn ra.</p>
          </div>
        )}
      </div>
    </main>
  );
}
