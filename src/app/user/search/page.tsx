import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = { title: "Kết quả tìm kiếm" };

async function searchBooks(keyword: string): Promise<any[]> {
  if (!keyword) return [];
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/books/search?keyword=${encodeURIComponent(keyword)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function SearchPage({ searchParams }: { searchParams: { keyword?: string } }) {
  const keyword = searchParams?.keyword ?? "";
  const books   = await searchBooks(keyword);
  const fmt     = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="bg-[#f0f0f0] min-h-screen">
      <Navbar />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 mt-6 pb-16">
        <h2 className="text-xl font-bold mb-6">
          Kết quả tìm kiếm cho:{" "}
          <span className="text-primary">"{keyword}"</span>
          <span className="text-sm font-normal text-gray-400 ml-2">({books.length} kết quả)</span>
        </h2>

        {books.length === 0 ? (
          <div className="bg-white rounded-2xl p-20 text-center text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-bold text-lg mb-2">Không tìm thấy sách phù hợp</p>
            <p className="text-sm mb-6">Hãy thử tìm kiếm với từ khóa khác.</p>
            <Link href="/" className="bg-red-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition">
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((b) => {
              const imgSrc = b.imageUrl
                ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${b.imageUrl}`
                : "/images/book-default.jpg";
              const hasDiscount = (b.tempDiscountPercent ?? 0) > 0;
              return (
                <Link key={b.id} href={`/books/${b.id}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 p-3 flex items-center justify-center">
                    <img src={imgSrc} alt={b.title}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }} />
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                        -{b.tempDiscountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-snug flex-1">{b.title}</p>
                    <p className="text-[11px] text-gray-400">{b.author?.name ?? ""}</p>
                    <span className="text-red-600 font-bold text-[15px] mt-1">{fmt(b.price ?? 0)} ₫</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}