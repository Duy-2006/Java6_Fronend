import { notFound } from "next/navigation";
import AuthorForm from "@/app/admin/authors/_components/AuthorsForm";

interface EditAuthorPageProps {
  params: Promise<{ id: string }>;  // ✅ Đánh dấu là Promise
}

async function getAuthor(id: string) {
  // ✅ Fallback URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${API_BASE}/api/admin/authors/${id}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: EditAuthorPageProps) {
  const { id } = await params;  // ✅ await params
  const author = await getAuthor(id);
  return { title: author ? `Cập Nhật: ${author.name}` : "Cập Nhật Tác Giả" };
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  const { id } = await params;  // ✅ await params
  const author = await getAuthor(id);
  if (!author) notFound();
  return <AuthorForm author={author} />;
}