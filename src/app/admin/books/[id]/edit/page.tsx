import { notFound } from "next/navigation";
import BookForm from "@/app/admin/books/_components/BooksForm";
import { getAllAuthors } from "@/services/authorsService";
import { getAllCategories } from "@/services/categoriesService";

interface EditBookPageProps {
  params: { id: string };
}

// Kiểu dữ liệu API trả về (Spring Boot)
interface BookApiResponse {
  id: number;
  title: string;
  isbn?: string;
  author?: { id: number; name: string };
  publisher?: string;
  category?: { id: number; name: string };
  price: number;
  quantity: number;
  active: boolean;
  description?: string;
  imageUrl?: string;
}

async function getBook(id: string): Promise<BookApiResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/books/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: EditBookPageProps) {
  const book = await getBook(params.id);
  return { title: book ? `Cập Nhật: ${book.title}` : "Cập Nhật Sách" };
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const [bookRaw, authors, categories] = await Promise.all([
    getBook(params.id),
    getAllAuthors(),
    getAllCategories(),
  ]);

  if (!bookRaw) notFound();

  // Map API response → BookForm props
  // API trả về author: { id, name } → BookForm cần authorId: number
  const book = {
    id:          bookRaw.id,
    title:       bookRaw.title,
    isbn:        bookRaw.isbn        ?? "",
    authorId:    bookRaw.author?.id  ?? "",
    publisher:   bookRaw.publisher   ?? "",
    categoryId:  bookRaw.category?.id ?? "",
    price:       bookRaw.price,
    quantity:    bookRaw.quantity,
    active:      bookRaw.active,
    description: bookRaw.description ?? "",
    imageUrl:    bookRaw.imageUrl    ?? "",
  };

  return <BookForm book={book} authors={authors} categories={categories} />;
}