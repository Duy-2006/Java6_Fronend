// app/books/[id]/page.tsx (hoặc user/books/[id]/page.tsx)
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AddToCartSection from "./_components/AddToCartSection";
import BookImage from "./_components/BookImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getBook(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/admin/books/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const book = await res.json();
    
    // Lấy thông tin flash sale để biết giá khuyến mãi
    let discountPercent = 0;
    let discountPrice = null;
    try {
      const flashRes = await fetch(`${API_URL}/api/books/flash-sale`, { next: { revalidate: 30 } });
      if (flashRes.ok) {
        const flashData = await flashRes.json();
        const found = flashData.find((item: any) => item.id === book.id);
        if (found) {
          discountPrice = found.discountPrice;
          discountPercent = found.discountValue || 0;
          // Nếu có discountPrice và không có discountPercent, tự tính
          if (discountPrice && book.price && !discountPercent) {
            discountPercent = Math.round((1 - discountPrice / book.price) * 100);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching flash sale", e);
    }
    
    return { ...book, discountPercent, discountPrice };
  } catch (error) {
    console.error("Error fetching book:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book?.title ?? "Chi tiết sách" };
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const hasDiscount = (book.discountPercent ?? 0) > 0;
  const originalPrice = book.price ?? 0;
  const discountedPrice = hasDiscount 
    ? (book.discountPrice ?? originalPrice * (100 - book.discountPercent) / 100)
    : originalPrice;

  const formattedDiscountedPrice = new Intl.NumberFormat("vi-VN").format(discountedPrice);
  const formattedOriginalPrice = hasDiscount ? new Intl.NumberFormat("vi-VN").format(originalPrice) : null;
  const discountValue = book.discountPercent ?? 0;

  // ---- Lấy thông tin linh hoạt ----
  const authorName =
    book.authorName ||
    (typeof book.author === "object" && book.author?.name) ||
    (typeof book.author === "string" ? book.author : null) ||
    "—";

  const publisher = book.publisher || "—";
  const supplier = book.supplier || book.publisher || "—";
  const description = book.description || "";

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
      <div className="bg-[#f0f0f0] min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-[1230px] mx-auto px-4 py-4 space-y-4">
            {/* Breadcrumb */}
            <nav className="text-[13px] text-gray-500 flex gap-2 items-center flex-wrap">
              <span className="text-gray-300">/</span>
              {book.category && (
                <>
                  <Link
                    href={`/category/${book.category.id}`}
                    className="hover:text-red-600 transition"
                  >
                    {book.category.name}
                  </Link>
                  <span className="text-gray-300">/</span>
                </>
              )}
              <span className="text-gray-800 font-medium truncate max-w-[300px]">
                {book.title}
              </span>
            </nav>

            <div className="grid grid-cols-12 gap-4">
              {/* LEFT COLUMN - Ảnh */}
              <div className="col-span-12 lg:col-span-5 space-y-4 h-fit lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl p-4 shadow-sm relative group overflow-hidden">
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    <BookImage imageUrl={book.imageUrl} title={book.title} />
                  </div>
                  {hasDiscount && (
                    <span className="absolute top-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded-sm font-bold shadow">
                      -{discountValue}%
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN - Thông tin chi tiết */}
              <div className="col-span-12 lg:col-span-7 space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                  <h1 className="text-[22px] font-semibold text-gray-800">
                    {book.title}
                  </h1>
                  <div className="grid grid-cols-2 text-[13px] gap-y-2 border-b border-gray-100 pb-4">
                    <p className="text-gray-500">
                      Nhà cung cấp:
                      <span className="text-blue-600 font-bold ml-1">{supplier}</span>
                    </p>
                    <p className="text-gray-500">
                      Tác giả:
                      <strong className="text-gray-800 ml-1">{authorName}</strong>
                    </p>
                    <p className="text-gray-500">
                      Nhà xuất bản:
                      <span className="text-gray-700 ml-1">{publisher}</span>
                    </p>
                    <p className="text-gray-500">
                      Hình thức bìa:
                      <strong className="text-gray-800 ml-1">Bìa Mềm</strong>
                    </p>
                  </div>
                  <div className="flex items-baseline gap-3 flex-wrap py-1">
                    <span className="text-[30px] font-bold text-red-600">
                      {formattedDiscountedPrice} ₫
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-gray-400 line-through text-base">
                          {formattedOriginalPrice} ₫
                        </span>
                        <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                          -{discountValue}%
                        </span>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-[13px] border border-gray-100">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-gray-500">
                        local_shipping
                      </span>
                      Giao hàng toàn quốc
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-gray-500">
                        payments
                      </span>
                      Thanh toán khi nhận hàng (COD)
                    </p>
                  </div>
                  <div className="pt-2 space-y-4 border-t border-gray-100">
                    <AddToCartSection bookId={book.id} stock={book.quantity ?? 0} />
                  </div>
                </div>

                {/* Mô tả sách */}
                {description && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-2">Mô tả sách</h2>
                    <p className="text-gray-700 whitespace-pre-line text-sm">
                      {description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}