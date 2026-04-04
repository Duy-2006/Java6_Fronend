import { notFound } from "next/navigation";
import AuthorForm from "@/app/admin/authors/_components/AuthorsForm";

interface EditAuthorPageProps {
  params: { id: string };
}

async function getAuthor(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/authors/${id}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: EditAuthorPageProps) {
  const author = await getAuthor(params.id);
  return { title: author ? `Cập Nhật: ${author.name}` : "Cập Nhật Tác Giả" };
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  const author = await getAuthor(params.id);
  if (!author) notFound();
  return <AuthorForm author={author} />;
}