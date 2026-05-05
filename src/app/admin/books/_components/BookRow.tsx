'use client';

import Link from "next/link";
import { useState } from "react";
import DeleteBookButton from "./DeleteBookButton";
import RestoreBookButton from "./RestoreBookButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const getCorrectImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return "https://placehold.co/50x75?text=No+Img";
  if (imageUrl.startsWith("http")) return imageUrl;
  let clean = imageUrl;
  if (clean.startsWith("books/")) clean = clean.substring(6);
  if (clean.startsWith("book/")) clean = clean.substring(5);
  return `${API_BASE}/uploads/books/${clean}`;
};

export default function BookRow({ book, onRefresh }: { book: any; onRefresh: () => void }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = !imgError && book.imageUrl ? getCorrectImageUrl(book.imageUrl) : "https://placehold.co/50x75?text=No+Img";
  const priceFormatted = new Intl.NumberFormat("vi-VN").format(book.price);

  return (
    <tr>
      <td className="text-center">
        <img src={imageUrl} alt={book.title} className="rounded shadow-sm border" style={{ width: 50, height: 75, objectFit: "cover" }} onError={() => setImgError(true)} />
      </td>
      <td className="text-start">
        <div className="d-flex flex-column">
          <span className="badge bg-light text-muted border mb-1 w-auto">{book.isbn || "N/A"}</span>
          <strong className="text-primary mb-1">{book.title}</strong>
          <small className="text-muted"><i className="fa-solid fa-pen-nib me-1" />{book.author?.name}</small>
        </div>
      </td>
      <td className="text-end fw-bold text-danger">{priceFormatted}đ</td>
      <td className="text-center">
        {book.quantity > 10 ? <span className="badge bg-success-subtle text-success">{book.quantity}</span> : book.quantity > 0 ? <span className="badge bg-warning-subtle text-warning"><i className="fa-solid fa-triangle-exclamation me-1" />{book.quantity}</span> : <span className="badge bg-danger-subtle text-danger">Hết hàng</span>}
      </td>
      <td className="text-center text-muted small">{book.category?.name}</td>
      <td className="text-center">
        {book.active ? <span className="badge rounded-pill text-bg-success">Đang bán</span> : <span className="badge rounded-pill text-bg-secondary">Đã ẩn</span>}
      </td>
      <td className="text-center">
        <div className="d-flex gap-2 justify-content-center">
          <Link href={`/admin/books/${book.id}/edit`} className="btn btn-outline-primary btn-sm">
            <i className="fa-solid fa-pen-to-square me-1"></i> Sửa
          </Link>
          {book.active ? (
            <DeleteBookButton bookId={book.id} onSuccess={onRefresh} />
          ) : (
            <RestoreBookButton bookId={book.id} onSuccess={onRefresh} />
          )}
        </div>
      </td>
    </tr>
  );
}