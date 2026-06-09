import { authFetch } from "@/lib/authFetch";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Danh sách Sách" };

async function getBooks(): Promise<any[]> {
  const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/books`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.filter((b: any) => b.active !== false) : [];
}

export default async function BooksPage() {
  let books: any[] = [];
  try { books = await getBooks(); } catch { }

  return (
    <main className="bg-[#f0f0f0] min-h-screen py-8">
      <div className="max-w-[1230px] mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Danh sách Sách</h1>
          <span className="text-sm text-gray-500">{books.length} sản phẩm</span>
        </div>

        {books.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-20 text-center text-gray-400">
            <p className="text-5xl mb-4">📚</p>
            <p className="font-medium">Chưa có sách nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function BookCard({ book }: { book: any }) {
  const imgSrc = book.imageUrl
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/books/${book.imageUrl}`
    : "/images/book-default.jpg";
  const price = new Intl.NumberFormat("vi-VN").format(book.price ?? 0);
  const hasDiscount = (book.tempDiscountPercent ?? 0) > 0;
  const originalPrice = hasDiscount
    ? new Intl.NumberFormat("vi-VN").format(
      Math.round((book.price * 100) / (100 - book.tempDiscountPercent))
    )
    : null;

  return (
    <Link href={`user/books/${book.id}`} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 flex items-center justify-center p-3">
        <img
          src={imgSrc}
          alt={book.title}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow">
            -{book.tempDiscountPercent}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-snug flex-1">{book.title}</p>
        <p className="text-[11px] text-gray-400">{book.author?.name}</p>
        <div className="mt-1 flex items-baseline gap-2 flex-wrap">
          <span className="text-red-600 font-bold text-[15px]">{price}₫</span>
          {originalPrice && (
            <span className="text-gray-400 line-through text-[11px]">{originalPrice}₫</span>
          )}
        </div>
      </div>
    </Link>
  );
}