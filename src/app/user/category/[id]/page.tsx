import { authFetch } from "@/lib/authFetch";
// app/user/category/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryBookList from "./CategoryBookList";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

async function getCategoryDetail(id: string) {
  try {
    const res = await authFetch(`${API_URL}/api/categories/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCategoryDetail(id);
  return { title: data ? `Danh mục: ${data.name}` : "Danh mục sách" };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCategoryDetail(id);
  if (!data) notFound();

  const { name, books = [] } = data;

  return (
    <div className="bg-[#f0f0f0] min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-[1230px] mx-auto px-4 py-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between border-l-4 border-red-600">
            <h1 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2">
              <span>{name}</span>
            </h1>
            <span className="text-sm text-gray-500 font-medium mt-2 sm:mt-0 bg-gray-100 px-3 py-1 rounded-full">
              {books.length} sản phẩm
            </span>
          </div>
          {books.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 text-center text-gray-400">
              <p className="text-5xl mb-4">📂</p>
              <p className="font-medium">Không có sách trong danh mục này.</p>
              <Link href="/" className="inline-block mt-4 bg-red-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-700">
                Về trang chủ
              </Link>
            </div>
          ) : (
            <CategoryBookList initialBooks={books} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}