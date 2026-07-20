import { authFetch } from "@/lib/authFetch";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AddToCartSection from "./_components/AddToCartSection";
import BookImage from "./_components/BookImage";
import SuggestedBooks from "./_components/SuggestedBooks";
import ReviewsSection from "./_components/ReviewsSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Helper chuyển đổi an toàn sang số
const toNumber = (val: any): number => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// Lấy thông tin sách + flash sale
async function getBook(id: string) {
  try {
    const res = await authFetch(`${API_URL}/api/admin/books/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const book = await res.json();

    const price = toNumber(book.price);
    let discountPercent = 0;
    let discountPrice: number | null = null;
    let usageLimit: number | null = null;

    try {
      const flashRes = await authFetch(`${API_URL}/api/books/flash-sale`, { next: { revalidate: 30 } });
      if (flashRes.ok) {
        const flashData = await flashRes.json();
        const found = Array.isArray(flashData) ? flashData.find((item: any) => item.id === book.id) : null;
        if (found) {
          discountPrice = found.discountPrice ? toNumber(found.discountPrice) : null;
          discountPercent = found.discountValue ? toNumber(found.discountValue) : 0;
          usageLimit = found.usageLimit ? toNumber(found.usageLimit) : null;

          if (discountPrice && price && !discountPercent) {
            discountPercent = Math.round((1 - discountPrice / price) * 100);
          }
          if (discountPercent && !discountPrice && price) {
            discountPrice = price * (100 - discountPercent) / 100;
          }
        }
      }
    } catch (e) {
      console.error("Flash sale error", e);
    }

    return { ...book, price, discountPercent, discountPrice, usageLimit };
  } catch (error) {
    console.error("Error fetching book:", error);
    return null;
  }
}

// Lấy sách gợi ý
async function getSuggestedBooks(bookId: number, categoryName?: string, authorName?: string) {
  try {
    const res = await authFetch(`${API_URL}/api/books`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = await res.json();
    const allBooks = Array.isArray(data) ? data : (data.content || []);
    const sameCategory = allBooks.filter(
      (b: any) => b.id !== bookId && b.categoryName === categoryName && categoryName
    );
    const sameAuthor = allBooks.filter(
      (b: any) => b.id !== bookId && b.authorName === authorName && authorName
    );
    const suggestedMap = new Map();
    [...sameCategory, ...sameAuthor].forEach((book) => suggestedMap.set(book.id, book));
    return Array.from(suggestedMap.values()).slice(0, 8);
  } catch (error) {
    console.error("Error fetching suggested books:", error);
    return [];
  }
}

// Lấy danh sách đánh giá của sách
async function getBookReviews(bookId: number) {
  try {
    const res = await authFetch(`${API_URL}/api/books/${bookId}/reviews`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Error fetching reviews for page title:", e);
    return [];
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

  const [suggestedBooks, reviews] = await Promise.all([
    getSuggestedBooks(
      book.id,
      book.category?.name || book.categoryName,
      book.authorName
    ),
    getBookReviews(book.id),
  ]);

  // Tính toán giá
  const originalPrice = book.price;
  const discountPercent = book.discountPercent;
  let discountPriceRaw = book.discountPrice ? toNumber(book.discountPrice) : null;
  const usageLimit = book.usageLimit;

  const hasDiscount = (discountPercent > 0) || (discountPriceRaw !== null && discountPriceRaw > 0 && discountPriceRaw < originalPrice);
  let finalPrice = originalPrice;
  if (hasDiscount) {
    if (discountPriceRaw !== null && discountPriceRaw > 0) {
      finalPrice = discountPriceRaw;
    } else if (discountPercent > 0) {
      finalPrice = originalPrice * (100 - discountPercent) / 100;
    }
  }

  const formattedFinalPrice = new Intl.NumberFormat("vi-VN").format(finalPrice);
  const formattedOriginalPrice = hasDiscount ? new Intl.NumberFormat("vi-VN").format(originalPrice) : null;
  const displayDiscountPercent = hasDiscount ? (discountPercent > 0 ? discountPercent : Math.round((1 - finalPrice / originalPrice) * 100)) : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const authorName = book.authorNames && book.authorNames.length > 0
    ? book.authorNames.join(", ")
    : (book.authors && book.authors.length > 0
      ? book.authors.map((a: any) => a.name).join(", ")
      : (book.authorName ||
        (typeof book.author === "object" && book.author?.name) ||
        (typeof book.author === "string" ? book.author : null) ||
        "—"));
  const publisher = book.publisherNames && book.publisherNames.length > 0
    ? book.publisherNames.join(", ")
    : (book.publishers && book.publishers.length > 0
      ? book.publishers.map((p: any) => p.name).join(", ")
      : (book.publisher || "—"));
  const description = book.description || "";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Breadcrumb - PDP style */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-8 flex-wrap">
            <Link href="/books" className="hover:text-black transition">Sách</Link>
            <span className="text-gray-300">/</span>
            <span className="hover:text-black transition cursor-pointer">{book.category?.name || book.categoryName || "Danh mục"}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{book.title}</span>
          </div>

          {/* Book Detail Section - 2 columns split (58% / 42% on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-start">

            {/* Left Column (58% width): Gallery + Description + Specs */}
            <div className="space-y-12">
              {/* Product Gallery container with {rounded.xxxl} (32px) and Soft Cloud bg */}
              <div className="relative aspect-[4/3] max-h-[500px] rounded-[32px] overflow-hidden bg-[#f5f5f7] border border-gray-100 flex items-center justify-center p-8 group">
                <div className="w-full h-full max-w-[280px] transition-transform duration-300 group-hover:scale-105">
                  <BookImage imageUrl={book.imageUrl} title={book.title} />
                </div>
                {hasDiscount && (
                  <span className="absolute top-6 left-6 bg-[#ffc700] text-black text-xs px-3 py-1 rounded-full font-extrabold shadow-sm">
                    -{displayDiscountPercent}% OFF
                  </span>
                )}
                {book.quantity === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider">Hết hàng</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {description && (
                <div className="space-y-4 pt-4">
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 uppercase">Mô tả sách</h2>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line text-justify">{description}</p>
                </div>
              )}

              {/* Technical Specs table style */}
              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-bold tracking-tight text-gray-900 uppercase">Thông tin chi tiết</h2>
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {[
                    { label: "Tác giả", value: authorName },
                    { label: "Nhà xuất bản", value: publisher },
                    { label: "Thể loại", value: book.category?.name || book.categoryName || "Đang cập nhật" },
                    { label: "Tình trạng", value: book.quantity > 0 ? `Còn hàng (${book.quantity} cuốn)` : "Hết hàng", isSuccess: book.quantity > 0 },
                  ].map((spec, idx) => (
                    <div key={idx} className="flex justify-between py-3.5 px-5 text-sm bg-white">
                      <span className="font-semibold text-gray-800">{spec.label}</span>
                      <span className={spec.isSuccess ? "text-green-600 font-bold" : "text-gray-600"}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (42% width): Sticky Purchase Rail */}
            <div className="sticky top-24 space-y-6">
              <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0_1px_4px_rgba(20,22,26,0.08)] space-y-6">

                {/* Title */}
                 <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight">{book.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                    <p>Tác giả: <span className="text-gray-800 font-bold">{authorName}</span></p>
                    <span className="text-gray-300">•</span>
                    <p>Thể loại: <span className="text-[#C92127] font-bold">{book.category?.name || book.categoryName || "Đang cập nhật"}</span></p>
                  </div>

                  {/* Rating / Review count */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#ffc700]/10 px-2.5 py-0.5 rounded-full text-[#ffc700] text-xs font-bold">
                      <span>{avgRating}</span>
                      <span className="text-[10px]">★</span>
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">({reviews.length} đánh giá thực tế)</span>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Price Display */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#C92127]">{formattedFinalPrice} đ</span>
                    {hasDiscount && (
                      <>
                        <span className="text-base text-gray-400 line-through font-medium">{formattedOriginalPrice} đ</span>
                        <span className="text-xs font-bold text-black bg-[#ffc700] px-2.5 py-0.5 rounded-full">
                          -{displayDiscountPercent}%
                        </span>
                      </>
                    )}
                  </div>
                  {hasDiscount && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-green-600 font-semibold">✓ Tiết kiệm thêm {(originalPrice - finalPrice).toLocaleString('vi-VN')} đ</p>
                      {usageLimit && (
                        <p className="text-xs text-[#C92127] font-bold">⚠️ Chỉ áp dụng giá ưu đãi tối đa {usageLimit} sản phẩm/đơn hàng</p>
                      )}
                    </div>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Warranty/Perks Card */}
                <div className="bg-[#f5f5f7] rounded-2xl p-4 space-y-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-[#C92127] font-bold">local_shipping</span>
                    <span className="font-semibold">Miễn phí giao hàng toàn quốc từ 500.000 đ</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-[#C92127] font-bold">verified_user</span>
                    <span className="font-semibold">Đảm bảo sách chính hãng 100% từ NXB</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-[#C92127] font-bold">assignment_return</span>
                    <span className="font-semibold">Đổi trả dễ dàng miễn phí trong vòng 30 ngày</span>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Purchase / Add to Cart control */}
                <div className="space-y-4">
                  <AddToCartSection bookId={book.id} stock={book.quantity ?? 0} usageLimit={usageLimit} />

                  <Link href={`/user/books/${book.id}/audiobook`} className="w-full bg-gradient-to-r from-gray-900 to-black text-white py-3 rounded-full font-bold hover:from-black hover:to-gray-900 transition duration-200 text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/20">
                    <span className="material-symbols-outlined text-lg text-red-500">headphones</span>
                    Nghe Sách Nói (Chương 1 Miễn Phí)
                  </Link>

                  <button className="w-full border-2 border-gray-900 text-gray-900 py-3 rounded-full font-bold hover:bg-gray-900 hover:text-white transition duration-200 text-sm flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">favorite</span>
                    Thêm vào yêu thích
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* Reviews Section */}
          <div className="mt-20">
            <ReviewsSection bookId={book.id} />
          </div>

          {/* Related / Suggested Books Section */}
          {suggestedBooks.length > 0 && (
            <div className="mt-20 border-t border-gray-100 pt-16 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 uppercase">Có thể bạn cũng thích</h2>
                <p className="text-sm text-gray-500 font-medium">Khám phá các đầu sách cùng thể loại hoặc cùng tác giả</p>
              </div>
              <SuggestedBooks books={suggestedBooks} />
            </div>
          )}

        </main>
        <Footer />
      </div>
    </>
  );
}