import { notFound } from "next/navigation";
import CategoryForm from "@/app/admin/categories/_components/CategoriesForm";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

async function getCategory(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${baseUrl}/api/categories/${id}`;
  console.log("[DEBUG] Fetching category from:", url);

  try {
    const res = await fetch(url, { cache: "no-store" });
    console.log("[DEBUG] Response status:", res.status);
    if (!res.ok) {
      console.error("[DEBUG] Failed to fetch category:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    console.log("[DEBUG] Category data:", data);
    return data;
  } catch (error) {
    console.error("[DEBUG] Fetch error:", error);
    return null;
  }
}

export async function generateMetadata({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const category = await getCategory(id);
  return { title: category ? `Cập Nhật: ${category.name}` : "Cập Nhật Thể Loại" };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) {
    console.error("[DEBUG] Category not found for id:", id);
    notFound();
  }
  return <CategoryForm category={category} />;
}