import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";

interface CategoryPageProps {
  params: { id: string };
}

async function getCategoryWithBooks(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}/books`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json(); // { category: {...}, books: [...] }
  } catch { return null; }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const data = await getCategoryWithBooks(params.id);
  return { title: data ? `Danh mục: ${data.category.name}` : "Danh mục sách" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const data = await getCategoryWithBooks(params.id);
  if (!data) notFound();

  const { category, books } = data;

  return (
    <>
      <main className="min-h-screen bg-[#f0f0f0]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-6 pb-16">

          {/* Breadcrumb */}
          <nav className="text-[13px] text-gray-500 flex gap-2 items-center mb-4">
            <Link href="/" className="hover:text-red-600 transition">Trang chủ</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800 font-medium">{category.name}</span>
          </nav>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Danh mục: <span className="text-primary">{category.name}</span>
            <span className="text-sm font-normal text-gray-400 ml-2">({books.length} sách)</span>
          </h2>

          {/* Empty */}
          {books.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 text-center text-gray-400">
              <p className="text-5xl mb-4">📂</p>
              <p className="font-medium">Không có sách trong danh mục này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map((b: any) => {
                const imgSrc = b.imageUrl
                  ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${b.imageUrl}`
                  : "/images/book-default.jpg";
                const price = new Intl.NumberFormat("vi-VN").format(b.price ?? 0);
                const hasDiscount = (b.tempDiscountPercent ?? 0) > 0;

                return (
                  <Link key={b.id} href={`/books/${b.id}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 flex items-center justify-center p-3">
                      <img src={imgSrc} alt={b.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                      />
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                          -{b.tempDiscountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <p className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-snug flex-1">{b.title}</p>
                      <p className="text-[11px] text-gray-400">{b.author?.name}</p>
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
    </>
  );
}