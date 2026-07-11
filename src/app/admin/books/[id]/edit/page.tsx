import { authFetch } from "@/lib/authFetch";
import { notFound } from "next/navigation";
import BookForm from "@/app/admin/books/_components/BooksForm";
import { getAllAuthors } from "@/services/authorsService";
import { getAllCategories } from "@/services/categoriesService";

interface EditBookPageProps {
  params: Promise<{ id: string }>;
}

async function getBook(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";
  const url = `${baseUrl}/api/admin/books/${id}`;
  console.log("[DEBUG] Fetching book from:", url);

  try {
    const res = await authFetch(url, { cache: "no-store" });
    console.log("[DEBUG] Response status:", res.status);
    if (!res.ok) {
      console.error("[DEBUG] Failed to fetch book:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    console.log("[DEBUG] Book data:", data);
    return data;
  } catch (error) {
    console.error("[DEBUG] Fetch error:", error);
    return null;
  }
}

export async function generateMetadata({ params }: EditBookPageProps) {
  const { id } = await params;
  const book = await getBook(id);
  return { title: book ? `Cập Nhật: ${book.title}` : "Cập Nhật Sách" };
}

async function getPublishersDirectly() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  try {
    const res = await authFetch(`${API_BASE}/api/admin/publishers`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Lỗi khi fetch nhà xuất bản:", error);
    return [];
  }
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { id } = await params;
  const [bookRaw, authors, categories, publishers] = await Promise.all([
    getBook(id),
    getAllAuthors(),
    getAllCategories(),
    getPublishersDirectly(),
  ]);

  if (!bookRaw) notFound();

  const book = {
    id: bookRaw.id,
    title: bookRaw.title,
    isbn: bookRaw.isbn ?? "",
    authorIds: bookRaw.authorIds ?? [],
    publisherIds: bookRaw.publisherIds ?? [],
    categoryId: bookRaw.categoryId ?? "",
    price: bookRaw.price,
    audioPrice: bookRaw.audioPrice ?? "",
    quantity: bookRaw.quantity,
    active: bookRaw.active,
    description: bookRaw.description ?? "",
    imageUrl: bookRaw.imageUrl ?? "",
  };

  return <BookForm book={book} authors={authors as any} categories={categories as any} publishers={publishers as any} />;
}