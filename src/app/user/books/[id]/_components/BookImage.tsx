"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

interface BookImageProps {
  imageUrl?: string;
  title: string;
  className?: string;       // Cho phép tùy chỉnh thêm class ngoài
  containerClassName?: string; // Class cho thẻ img (nếu muốn ghi đè hoàn toàn)
}

export default function BookImage({ 
  imageUrl, 
  title, 
  className = "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
  containerClassName 
}: BookImageProps) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Xử lý đường dẫn ảnh: loại bỏ tiền tố "books/" nếu có
  let cleanUrl = imageUrl;
  if (cleanUrl?.startsWith("books/")) {
    cleanUrl = cleanUrl.substring(6);
  }

  // Nếu có lỗi hoặc không có ảnh, dùng ảnh mặc định
  const finalSrc = (cleanUrl && !imgError) 
    ? `${API_URL}/uploads/books/${cleanUrl}` 
    : "/images/book-default.jpg";

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={finalSrc}
        alt={title}
        className={containerClassName || className}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}