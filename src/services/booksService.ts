/*
 * booksService.ts
 * Lop service xu ly cac thao tac CRUD doi voi du lieu sach (Book) tren he thong Admin.
 * Tat ca cac ham deu goi API backend thong qua authFetch (tu dong gui cookie xac thuc).
 * URL goc cua backend duoc lay tu bien moi truong NEXT_PUBLIC_API_URL, mac dinh la localhost:8080.
 */

import { authFetch } from "@/lib/authFetch";

// Dia chi goc cua backend Spring Boot, doc tu bien moi truong hoac mac dinh la localhost:8080
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Dinh nghia kieu du lieu cua mot cuon sach, tuong ung voi BookDTO ben backend Java
export interface Book {
  id?: number;           // Ma sach (tu dong tang boi database)
  title: string;         // Ten sach
  isbn?: string;         // Ma ISBN cua sach
  authorId?: number;     // Ma tac gia (khoa ngoai lien ket voi bang Author)
  publisher?: string;    // Ten nha xuat ban
  categoryId?: number;   // Ma the loai (khoa ngoai lien ket voi bang Category)
  price: number;         // Gia ban sach giay (don vi: VND)
  quantity: number;      // So luong ton kho
  active: boolean;       // Trang thai hien thi (true = dang ban, false = an khoi gian hang)
  description?: string;  // Mo ta chi tiet ve cuon sach
  imageUrl?: string;     // Duong dan anh bia sach (luu trong thu muc uploads/books/)
  audioPrice?: number;   // Gia ban phien ban sach noi (0 = chua co sach noi)
  authorIds?: number[];
  authorNames?: string[];
  categoryName?: string;
  soldCount?: number;
}

// Lay toan bo danh sach sach tu backend (dung cho trang quan ly sach Admin)
// Tham so t=Date.now() de tranh cache trinh duyet tra ve du lieu cu
export async function getAllBooks(): Promise<Book[]> {
  const res = await authFetch(`${BASE_URL}/api/admin/books?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không thể tải danh sách sách.");
  return res.json();
}

// Lay thong tin chi tiet cua 1 cuon sach theo ma ID
export async function getBookById(id: number): Promise<Book> {
  const res = await authFetch(`${BASE_URL}/api/admin/books/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tìm thấy sách.");
  return res.json();
}

// Xoa mot cuon sach khoi database theo ma ID
export async function deleteBook(id: number): Promise<void> {
  const res = await authFetch(`${BASE_URL}/api/admin/books/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa sách thất bại.");
}

// Cập nhật giá sách nói
export async function updateAudioPrice(id: number, audioPrice: number): Promise<Book> {
  const formData = new URLSearchParams();
  formData.append("audioPrice", String(audioPrice));
  
  const res = await authFetch(`${BASE_URL}/api/admin/books/${id}/audio-price`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString()
  });
  if (!res.ok) throw new Error("Cập nhật giá sách nói thất bại.");
  return res.json();
}
