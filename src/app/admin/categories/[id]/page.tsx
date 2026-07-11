import { authFetch } from "@/lib/authFetch";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, FolderKanban, Sparkles } from "lucide-react";
import CategoryBooksList from "@/app/admin/categories/_components/CategoryBooksList";

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getCategoryDetails(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${baseUrl}/api/categories/${id}`;
  try {
    const res = await authFetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: CategoryDetailPageProps) {
  const { id } = await params;
  const category = await getCategoryDetails(id);
  return { title: category ? `Chi Tiết: ${category.name}` : "Chi Tiết Thể Loại" };
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { id } = await params;
  const category = await getCategoryDetails(id);
  
  if (!category) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const getImageUrl = (url?: string) => {
    if (!url) return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60";
    if (url.startsWith("http")) return url;
    return `${baseUrl}${url}`;
  };

  return (
    <div className="space-y-8 max-w-[1600px] w-full mx-auto p-6 animate__animated animate__fadeIn font-sans">
      
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/admin/categories" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#b70011] transition-all bg-white hover:bg-red-50/20 px-3.5 py-2 rounded-lg border border-slate-200/60 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Danh sách danh mục</span>
        </Link>

        <Link 
          href={`/admin/categories/${id}/edit`} 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#b70011] hover:bg-[#b70011]/90 transition-all px-4 py-2.5 rounded-lg shadow-md shadow-[#b70011]/10 hover:shadow-[#b70011]/25 active:scale-[0.98]"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Chỉnh sửa thể loại</span>
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg relative overflow-hidden text-white border border-slate-800">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
          {/* Cover / Icon */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden bg-white/10 backdrop-blur-md flex-shrink-0 shadow-2xl border-2 border-white/20 p-1">
             <img 
                src={getImageUrl(category.imageUrl)} 
                alt={category.name} 
                className="w-full h-full object-cover rounded-lg"
             />
          </div>

          {/* Details */}
          <div className="flex-grow text-center md:text-left space-y-3">
             <div className="flex items-center justify-center md:justify-start gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
               <FolderKanban className="w-4 h-4" />
               <span>Danh mục hệ thống</span>
               <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
             </div>
             
             <h1 className="text-3xl md:text-4xl font-black tracking-tight">{category.name}</h1>
             
             <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
               Các tác phẩm thuộc thể loại này được kiểm duyệt, phân loại và cập nhật liên tục từ những nhà xuất bản uy tín.
               Xem thống kê chi tiết sản phẩm, lượng sách tồn và thực hiện các điều chỉnh danh mục bên dưới.
             </p>
          </div>
        </div>
      </div>

      {/* Category Books List & Stats Component */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#b70011]" />
            <h3 className="text-lg font-black text-slate-800">Thống kê & Danh mục ấn phẩm</h3>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {category.books?.length || 0} Ấn phẩm
          </span>
        </div>
        
        <CategoryBooksList 
          books={category.books || []} 
          categoryName={category.name} 
          baseUrl={baseUrl} 
        />
      </div>

    </div>
  );
}
