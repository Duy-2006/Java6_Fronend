import { notFound } from "next/navigation";
import CategoryForm from "@/app/admin/categories/_components/CategoriesForm";

interface EditCategoryPageProps {
  params: { id: string };
}

async function getCategory(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: EditCategoryPageProps) {
  const category = await getCategory(params.id);
  return { title: category ? `Cập Nhật: ${category.name}` : "Cập Nhật Thể Loại" };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const category = await getCategory(params.id);
  if (!category) notFound();
  return <CategoryForm category={category} />;
}