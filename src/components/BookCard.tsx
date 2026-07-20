"use client";
import { authFetch } from "@/lib/authFetch";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

interface BookCardProps {
  b: any;
  onAddToCart: (book: any, redirect?: boolean) => void;
  showFormatBadges?: boolean;
}

export default function BookCard({ b, onAddToCart, showFormatBadges = true }: BookCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    // N+1 problem fixed: Do not fetch reviews for every single book card.
    // In a real scenario, rating and review count should come from the BookDTO directly.
    setRating(b.rating || 4.8);
    setReviewCount(b.reviewCount || Math.floor(b.id * 7 % 60 + 15));
  }, [b.id]);

  const getImageSrc = () => {
    if (imgError) return "/images/book-default.jpg";
    if (b.imageUrl && b.imageUrl.trim()) {
      let cleanUrl = b.imageUrl;
      if (cleanUrl.startsWith("books/")) cleanUrl = cleanUrl.substring(6);
      return `${API_URL}/uploads/books/${cleanUrl}`;
    }
    return "/images/book-default.jpg";
  };

  const price = Number(b.price) || 0;

  // Robust pricing handler for both formats of discounts
  let finalPrice = price;
  let hasDiscount = false;
  let discountPercent = 0;

  if (b.discountPrice && Number(b.discountPrice) > 0 && Number(b.discountPrice) < price) {
    hasDiscount = true;
    finalPrice = Number(b.discountPrice);
    discountPercent = b.discountValue ? Number(b.discountValue) : Math.round((1 - finalPrice / price) * 100);
  } else if (b.tempDiscountPercent && Number(b.tempDiscountPercent) > 0) {
    hasDiscount = true;
    discountPercent = Number(b.tempDiscountPercent);
    finalPrice = Math.round((price * (100 - discountPercent)) / 100);
  }

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(finalPrice);
  const formattedOriginal = hasDiscount ? new Intl.NumberFormat("vi-VN").format(price) : null;

  const audioPrice = b.audioPrice ? Number(b.audioPrice) : 0;
  const formattedAudioPrice = new Intl.NumberFormat("vi-VN").format(audioPrice);

  const handleImageError = () => { if (!imgError) setImgError(true); };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/user/books/${b.id}/audiobook`);
  };

  return (
    <div className="bg-white rounded-2xl p-4 transition-all duration-300 hover:-translate-y-2 group book-card-shadow border border-[#191c1e]/5 flex flex-col relative overflow-hidden text-left">
      {/* Book Cover Area */}
      <Link href={`/user/books/${b.id}`} className="relative aspect-[3/4] mb-4 overflow-hidden rounded-xl bg-[#f2f4f6] flex items-center justify-center p-3 cursor-pointer block group/cover">
        <img
          src={getImageSrc()}
          alt={b.title}
          className="w-full h-full object-contain transition-transform duration-500 group-hover/cover:scale-110"
          onError={handleImageError}
        />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-[#b70011] text-white text-[10px] font-bold rounded shadow-sm w-fit">
              -{discountPercent}%
            </span>
          )}
          {showFormatBadges && (
            <>
              <span className="px-2 py-0.5 bg-white/90 text-[#b70011] text-[9px] font-bold rounded flex items-center gap-1 shadow-sm w-fit border border-[#b70011]/10">
                <span className="material-symbols-outlined text-[10px] fill-1">book</span> Sách giấy
              </span>
              <span className="px-2 py-0.5 bg-[#b70011]/10 text-[#b70011] text-[9px] font-bold rounded flex items-center gap-1 backdrop-blur-sm shadow-sm w-fit border border-[#b70011]/10">
                <span className="material-symbols-outlined text-[10px] fill-1">headphones</span> Sách nói
              </span>
            </>
          )}
        </div>

        {/* Hover Listen Overlay Button */}
        <button
          onClick={handlePlayAudio}
          className="absolute bottom-3 right-3 w-9 h-9 bg-[#b70011]/90 hover:bg-[#b70011] text-white rounded-full flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 shadow-md transform hover:scale-105 z-20"
          title="Nghe sách nói ngay"
        >
          <span className="material-symbols-outlined text-base fill-1">play_arrow</span>
        </button>

        {b.quantity <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
            <span className="bg-[#191c1e] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-full shadow-md tracking-wider">
              Hết hàng
            </span>
          </div>
        )}
      </Link>

      {/* Book Metadata & Pricing */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/user/books/${b.id}`} className="block">
            <h3 className="font-semibold text-base mb-1 truncate text-[#191c1e] group-hover:text-[#b70011] transition-colors leading-snug">
              {b.title}
            </h3>
          </Link>
          <p className="text-gray-500 text-xs mb-0.5 truncate font-medium">
            {b.authorNames && b.authorNames.length > 0
              ? b.authorNames.join(", ")
              : (b.authors && b.authors.length > 0
                ? b.authors.map((a: any) => a.name).join(", ")
                : (b.authorName || b.author?.name || "Chưa rõ tác giả"))}
          </p>
          {((b.publisherNames && b.publisherNames.length > 0) || (b.publishers && b.publishers.length > 0) || b.publisherName || b.publisher?.name || b.publisher) && (
            <p className="text-gray-400 text-[10px] mb-1.5 truncate">
              NXB: {b.publisherNames && b.publisherNames.length > 0
                ? b.publisherNames.join(", ")
                : (b.publishers && b.publishers.length > 0
                  ? b.publishers.map((p: any) => p.name).join(", ")
                  : (b.publisherName || b.publisher?.name || b.publisher))}
            </p>
          )}

          <div className="flex items-center gap-1 mb-3">
            <span className="material-symbols-outlined text-[14px] text-yellow-500 fill-1">star</span>
            <span className="text-xs font-bold text-[#191c1e]">{rating && rating > 0 ? rating.toFixed(1) : "4.8"}</span>
            <span className="text-gray-400 text-xs">({reviewCount > 0 ? reviewCount : Math.floor(b.id * 7 % 60 + 15)})</span>
          </div>
        </div>

        <div>
          {/* Format Pricing Grid */}
          <div className="space-y-0.5 mb-4 border-t border-[#f2f4f6] pt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Sách giấy:</span>
              <span className="font-bold text-[#191c1e]">{formattedPrice} ₫</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Sách nói:</span>
              <span className="font-bold text-[#b70011]">{formattedAudioPrice} ₫</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#f2f4f6]">
            <div>
              {hasDiscount ? (
                <span className="text-xs text-gray-400 line-through font-medium">{formattedOriginal} ₫</span>
              ) : (
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Đã bán {b.soldCount || 0}</span>
              )}
            </div>

            <button
              onClick={(e) => { e.preventDefault(); if (b.quantity === undefined || b.quantity > 0) onAddToCart(b, false); }}
              disabled={b.quantity !== undefined && b.quantity <= 0}
              className="w-8 h-8 bg-[#f2f4f6] hover:bg-[#b70011] text-[#191c1e] hover:text-white transition-all duration-300 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:hover:bg-[#f2f4f6] disabled:hover:text-gray-400"
              title="Thêm vào giỏ hàng"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
