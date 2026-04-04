import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartSection from "./_components/AddToCartSection";

interface BookDetailPageProps {
  params: { id: string };
}

async function getBook(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/books/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: BookDetailPageProps) {
  const book = await getBook(params.id);
  return { title: book?.title ?? "Chi tiết sách" };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const book = await getBook(params.id);
  if (!book) notFound();

  const hasDiscount = (book.tempDiscountPercent ?? 0) > 0;
  const price        = new Intl.NumberFormat("vi-VN").format(book.price ?? 0);
  const originalPrice = hasDiscount
    ? new Intl.NumberFormat("vi-VN").format(
        Math.round((book.price * 100) / (100 - book.tempDiscountPercent))
      )
    : null;

  const imgSrc = book.imageUrl
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/books/${book.imageUrl}`
    : "/images/book-default.jpg";

  return (
    <>
      {/* Material Icons */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

      <main className="bg-[#f0f0f0] min-h-screen">
        <div className="max-w-[1230px] mx-auto px-4 py-4 space-y-4">

          {/* Breadcrumb */}
          <nav className="text-[13px] text-gray-500 flex gap-2 items-center flex-wrap">
            <Link href="/" className="hover:text-red-600 transition">Trang chủ</Link>
            <span className="text-gray-300">/</span>
            {book.category && (
              <>
                <Link href={`/category/${book.category.id}`} className="hover:text-red-600 transition">
                  {book.category.name}
                </Link>
                <span className="text-gray-300">/</span>
              </>
            )}
            <span className="text-gray-800 font-medium truncate max-w-[300px]">{book.title}</span>
          </nav>

          {/* Main grid */}
          <div className="grid grid-cols-12 gap-4">

            {/* ── LEFT: Images + Policy ── */}
            <div className="col-span-12 lg:col-span-5 space-y-4 h-fit lg:sticky lg:top-24">

              {/* Main image */}
              <div className="bg-white rounded-2xl p-4 shadow-sm relative group overflow-hidden">
                <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  <img
                    src={imgSrc}
                    alt={book.title}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                  />
                </div>
                {hasDiscount && (
                  <span className="absolute top-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded-sm font-bold shadow">
                    -{book.tempDiscountPercent}%
                  </span>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <div className="w-16 h-16 flex-shrink-0 bg-white border-2 border-red-500 rounded-lg p-1 cursor-pointer shadow-sm">
                  <img src={imgSrc} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="w-16 h-16 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-1 cursor-pointer hover:border-red-400 opacity-50 transition">
                  <img src={imgSrc} alt="" className="w-full h-full object-contain grayscale" />
                </div>
              </div>

              {/* Policy card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3 text-[13px]">
                <h3 className="font-bold uppercase text-[11px] text-gray-400 tracking-wider">Chính sách của chúng tôi</h3>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="material-symbols-outlined text-red-500 text-xl">local_shipping</span>
                  <p><strong>Giao hàng:</strong> Nhanh chóng &amp; uy tín</p>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="material-symbols-outlined text-red-500 text-xl">published_with_changes</span>
                  <p><strong>Đổi trả:</strong> Miễn phí toàn quốc</p>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="material-symbols-outlined text-red-500 text-xl">verified_user</span>
                  <p><strong>Bảo đảm:</strong> Hàng chính hãng 100%</p>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Info + Actions ── */}
            <div className="col-span-12 lg:col-span-7 space-y-4">

              {/* Main info card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">

                {/* Title */}
                <h1 className="text-[22px] font-semibold text-gray-800 leading-snug">{book.title}</h1>

                {/* Meta grid */}
                <div className="grid grid-cols-2 text-[13px] gap-y-2 border-b border-gray-100 pb-4">
                  <p className="text-gray-500">Nhà cung cấp:
                    <span className="text-blue-600 font-bold ml-1">{book.publisher ?? "—"}</span>
                  </p>
                  <p className="text-gray-500">Tác giả:
                    <strong className="text-gray-800 ml-1">{book.author?.name ?? "—"}</strong>
                  </p>
                  <p className="text-gray-500">Nhà xuất bản:
                    <span className="text-gray-700 ml-1">{book.publisher ?? "—"}</span>
                  </p>
                  <p className="text-gray-500">Hình thức bìa:
                    <strong className="text-gray-800 ml-1">Bìa Mềm</strong>
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 flex-wrap py-1">
                  <span className="text-[30px] font-bold text-red-600">{price} ₫</span>
                  {originalPrice && (
                    <>
                      <span className="text-gray-400 line-through text-base">{originalPrice} ₫</span>
                      <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                        -{book.tempDiscountPercent}%
                      </span>
                    </>
                  )}
                </div>

                {/* Shipping info */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-[13px] border border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="font-bold flex items-center gap-2 text-gray-700">
                      <span className="material-symbols-outlined text-green-600 text-lg">location_on</span>
                      Thông tin vận chuyển
                    </p>
                    <button className="text-blue-600 font-medium text-xs hover:underline">Thay đổi</button>
                  </div>
                  <p className="text-gray-600">Giao hàng đến <strong className="text-gray-800">Ninh Kiều, Cần Thơ</strong></p>
                  <p className="text-gray-400 italic text-xs">Dự kiến giao hàng vào ngày mai</p>
                </div>

                {/* Promotions */}
                <div className="space-y-2">
                  <p className="text-[12px] font-bold text-gray-600 flex items-center gap-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-orange-500 text-lg">sell</span>
                    Chương trình ưu đãi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-orange-100 transition">
                      <span className="text-[11px] font-bold text-orange-600">GIẢM 15K</span>
                      <span className="material-symbols-outlined text-orange-400 text-sm">info</span>
                    </div>
                    <div className="border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition">
                      <span className="text-[11px] font-bold text-blue-600">ZALOPAY -20K</span>
                      <span className="material-symbols-outlined text-blue-400 text-sm">info</span>
                    </div>
                  </div>
                </div>

                {/* Quantity + CTA — client component */}
                <div className="pt-2 space-y-4 border-t border-gray-100">
                  <AddToCartSection bookId={book.id} stock={book.quantity ?? 0} />
                </div>
              </div>

              {/* Detail table */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold border-b border-gray-100 pb-3 mb-4 uppercase text-gray-700 tracking-wide">
                  Thông tin chi tiết
                </h2>
                <table className="w-full text-[13px]">
                  <tbody>
                    {[
                      { label: "Mã hàng",     value: book.isbn        ?? "—" },
                      { label: "Tác giả",      value: book.author?.name ?? "—" },
                      { label: "Nhà xuất bản", value: book.publisher   ?? "—" },
                      { label: "Trọng lượng",  value: "350 gr"              },
                      { label: "Số trang",     value: "256 trang"           },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 text-gray-400 w-1/3">{row.label}</td>
                        <td className="py-3 font-medium text-gray-800">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-base font-bold border-b border-gray-100 pb-3 mb-6 uppercase text-gray-700 tracking-wide">
              Mô tả sản phẩm
            </h2>
            <div className="leading-7 text-gray-700 whitespace-pre-line text-sm">
              {book.description ?? "Chưa có mô tả."}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}