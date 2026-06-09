import { authFetch } from "@/lib/authFetch";
// app/user/category/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BookImage from "../BookImage"; // import từ file category/BookImage.tsx

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

async function getCategoryDetail(id: string) {
  try {
    const res = await authFetch(`${API_URL}/api/categories/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCategoryDetail(id);
  return { title: data ? `Danh mục: ${data.name}` : "Danh mục sách" };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCategoryDetail(id);
  if (!data) notFound();

  const { name, books = [] } = data;

  return (
    <div className="bg-[#f0f0f0] min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-[1230px] mx-auto px-4 py-4 space-y-4">
          {books.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 text-center text-gray-400">
              <p className="text-5xl mb-4">📂</p>
              <p className="font-medium">Không có sách trong danh mục này.</p>
              <Link href="/" className="inline-block mt-4 bg-red-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-700">
                Về trang chủ
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map((book: any) => {
                const price = new Intl.NumberFormat("vi-VN").format(book.price ?? 0);
                const hasDiscount = (book.tempDiscountPercent ?? 0) > 0;
                return (
                  <Link
                    key={book.id}
                    href={`/user/books/${book.id}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 flex items-center justify-center p-3">
                      <BookImage imageUrl={book.imageUrl} title={book.title} />
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                          -{book.tempDiscountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <p className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-snug flex-1">{book.title}</p>
                      <p className="text-[11px] text-gray-400">{book.authorName || ""}</p>
                      <span className="text-red-600 font-bold text-[15px] mt-1">{price} ₫</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}