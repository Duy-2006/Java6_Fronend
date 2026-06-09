"use client";

import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

interface Book {
  id: number;
  title: string;
  price: number;
  imageUrl?: string;
}

export default function SuggestedBooks({ books }: { books: Book[] }) {
  if (!books.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {books.map((book) => (
        <Link key={book.id} href={`/user/books/${book.id}`} className="group block space-y-3">
          <div className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-[#f5f5f7] border border-gray-100 flex items-center justify-center p-4 transition-transform duration-200 group-hover:scale-[1.02]">
            <img
              src={`${API_URL}/uploads/books/${book.imageUrl?.replace(/^books\//, '') || 'default.jpg'}`}
              alt={book.title}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/book-default.jpg';
              }}
            />
          </div>
          <div className="space-y-1 px-1">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#C92127] transition">
              {book.title}
            </h3>
            <p className="text-sm font-black text-[#C92127]">
              {new Intl.NumberFormat('vi-VN').format(book.price)} đ
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}