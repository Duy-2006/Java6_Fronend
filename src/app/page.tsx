"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const BANNERS = ["/uploads/s1.webp","/uploads/s2.webp","/uploads/s3.webp","/uploads/s4.webp"];

const CATEGORIES = [
  "Boardgame","Máy Tính Điện Tử","Giấy Photo","Quả Địa Cầu","Lịch Sử Việt Nam",
  "Văn Học","Tâm Lý Kỹ Năng","Thiếu Nhi","Sách Học Ngoại Ngữ","Sách Tham Khảo",
];

function BookCard({ b }: { b: any }) {
  const imgSrc = b.imageUrl
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/books/${b.imageUrl}`
    : "/images/book-default.jpg";
  const price = new Intl.NumberFormat("vi-VN").format(b.price ?? 0);
  const hasDiscount = (b.tempDiscountPercent ?? 0) > 0;
  const originalPrice = hasDiscount
    ? new Intl.NumberFormat("vi-VN").format(Math.round(b.price * 100 / (100 - b.tempDiscountPercent)))
    : null;
  return (
    <Link href={`/books/${b.id}`}
      className="bg-white p-3 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer">
      <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-lg">
        {hasDiscount && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-bl-xl z-10">
            -{b.tempDiscountPercent}%
          </span>
        )}
        <img src={imgSrc} alt={b.title}
          className="w-full h-full object-contain mix-blend-multiply transition duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }} />
      </div>
      <div className="space-y-1 flex-1">
        <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 h-9 group-hover:text-red-600 transition">{b.title}</h3>
        <div className="flex flex-col">
          <span className="text-red-600 font-bold text-base">{price} ₫</span>
          {originalPrice && <span className="text-gray-400 text-[11px] line-through">{originalPrice} ₫</span>}
        </div>
        <div className="flex text-orange-400 text-[10px]">★★★★★</div>
        <div className="mt-2 relative w-full h-4 bg-red-100 rounded-full overflow-hidden border border-red-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-600 w-[60%] rounded-full" />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-bold uppercase tracking-tighter">Đã bán 11</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [slide, setSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600 + 9*60 + 25);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books/new`)
      .then(r => r.ok ? r.json() : []).then(setBooks).catch(() => {});
  }, []);

  // Banner auto-slide
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % BANNERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => t > 0 ? t - 1 : 3600 * 2);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const h = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="bg-[#f0f0f0] font-display text-gray-800">
      <Navbar />

      <main className="max-w-[1230px] mx-auto px-4 mt-4 space-y-6 pb-12">

        {/* ── Banner + Side images ── */}
        <div className="grid grid-cols-12 gap-3 lg:gap-4">
          <section className="col-span-12 lg:col-span-8 relative rounded-xl overflow-hidden shadow-sm h-[200px] md:h-[300px] lg:h-[320px] bg-white">
            <div className="relative h-full w-full">
              {BANNERS.map((src, i) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                  <img src={src} className="w-full h-full object-fill lg:object-cover" alt={`Banner ${i+1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/1200x320/C92127/white?text=Banner+${i+1}`;
                    }} />
                </div>
              ))}
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: i === slide ? 20 : 8, backgroundColor: i === slide ? "#C92127" : "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </section>
          <div className="hidden lg:col-span-4 lg:flex flex-col gap-3 h-[320px]">
            {["/uploads/d1.webp","/uploads/d2.webp"].map((src, i) => (
              <div key={i} className="flex-1 rounded-xl overflow-hidden shadow-sm bg-gray-100">
                <img src={src} className="w-full h-full object-fill cursor-pointer"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x150/eee/999?text=Promo+${i+1}`; }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Flash Sale ── */}
        <section>
          <div className="bg-red-600 rounded-t-xl p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black italic tracking-tighter uppercase">⚡ Flash Sale</h2>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span>Kết thúc trong:</span>
                <div className="flex gap-1 items-center">
                  {[h, m, s].map((unit, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="bg-black px-2 py-1 rounded font-mono">{unit}</span>
                      {i < 2 && <span>:</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/books" className="text-sm font-bold hover:underline">Xem tất cả &gt;</Link>
          </div>
          <div className="bg-white rounded-b-xl p-4 shadow-sm border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.slice(0, 10).map(b => <BookCard key={b.id} b={b} />)}
            </div>
          </div>
        </section>

        {/* ── Danh mục ── */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-50">
            <span className="material-symbols-outlined text-red-600 text-2xl">widgets</span>
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Danh mục sản phẩm</h2>
          </div>
          <div className="p-6 flex justify-between items-start gap-4 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((name, i) => (
              <div key={name} className="flex flex-col items-center gap-3 group cursor-pointer min-w-[100px] flex-1 transition-transform hover:-translate-y-1">
                <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center transition-all duration-300 group-hover:drop-shadow-lg">
                  <img src={`/uploads/e${i+1}.webp`} className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
                </div>
                <span className="text-[11px] font-bold text-gray-700 text-center group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bảng xếp hạng bán chạy ── */}
        {books.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] px-6 py-3">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Bảng xếp hạng bán chạy tuần</h2>
            </div>
            {/* Tab bar */}
            <div className="border-b overflow-x-auto no-scrollbar bg-white">
              <div className="flex px-4">
                <button className="px-4 py-3 text-sm font-bold text-red-600 border-b-2 border-red-600 whitespace-nowrap">Văn học</button>
                <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 whitespace-nowrap transition">Kinh tế</button>
              </div>
            </div>
            <div className="grid grid-cols-12 p-6 gap-8">
              {/* Top 5 list */}
              <div className="col-span-12 lg:col-span-5 space-y-4 border-r pr-6">
                {books.slice(0, 5).map((b, idx) => (
                  <Link key={b.id} href={`/books/${b.id}`}
                    className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition">
                    <div className="flex flex-col items-center min-w-[30px]">
                      <span className="text-lg font-black text-gray-400">{String(idx + 1).padStart(2, "0")}</span>
                      <span className="material-symbols-outlined text-green-500 text-sm">arrow_upward</span>
                    </div>
                    <div className="w-14 h-20 flex-shrink-0 border rounded-lg overflow-hidden bg-white">
                      <img src={b.imageUrl ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/books/${b.imageUrl}` : "/images/book-default.jpg"}
                        className="w-full h-full object-contain" alt={b.title} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-[13px] font-bold text-gray-800 truncate group-hover:text-red-600">{b.title}</h4>
                      <p className="text-[11px] text-gray-400">{b.author?.name}</p>
                      <p className="text-[11px] text-blue-500 font-bold">{(idx + 1) * 1234} điểm</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Featured book */}
              <div className="col-span-12 lg:col-span-7 flex gap-6 items-start">
                <div className="w-1/3 aspect-[3/4] border rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-gray-50">
                  <img src={books[0].imageUrl ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/books/${books[0].imageUrl}` : "/images/book-default.jpg"}
                    className="w-full h-full object-contain p-2" alt={books[0].title} />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-bold text-gray-800 leading-tight">{books[0].title}</h3>
                  <div className="text-[12px] text-gray-500 space-y-1">
                    <p>Tác giả: <strong className="text-black">{books[0].author?.name}</strong></p>
                    <p>Nhà xuất bản: <strong className="text-black">{books[0].publisher}</strong></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-red-600">
                      {new Intl.NumberFormat("vi-VN").format(books[0].price ?? 0)} ₫
                    </span>
                    <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded">-23%</span>
                  </div>
                  <p className="text-[12px] text-gray-600 line-clamp-4 leading-relaxed italic">{books[0].description}</p>
                  <Link href={`/books/${books[0].id}`} className="text-red-600 text-xs font-bold hover:underline">Xem chi tiết &gt;</Link>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-center border-t">
              <Link href="/books"
                className="px-10 py-2 border border-red-600 text-red-600 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition duration-300">
                Xem thêm
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}