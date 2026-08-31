'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, Sparkles, Phone, MapPin, Building2, BookOpen, Ban, CheckCircle } from "lucide-react";
import ConfirmModal from "@/app/admin/_components/ConfirmModal";
import { getPublisherById, updatePublisher, Publisher } from "@/services/publishersService";
import { getAllBooks, Book } from "@/services/booksService";
import PublisherBooksList from "../_components/PublisherBooksList";
import { useToast } from "@/components/ui/use-toast";

export default function PublisherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idStr = params?.id as string;
  const id = idStr ? Number(idStr) : null;

  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setError("Mã nhà xuất bản không hợp lệ.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const pubData = await getPublisherById(id as number);
        setPublisher(pubData);

        try {
          const allBooks = await getAllBooks();
          const filtered = allBooks.filter((book: any) => 
            book.publisherIds?.includes(id as number) || book.publisher === pubData.name
          );
          setBooks(filtered);
        } catch (err) {
          console.error("Error loading books for publisher:", err);
        }
      } catch (err) {
        console.error("Error loading publisher:", err);
        setError("Không tìm thấy thông tin nhà xuất bản hoặc nhà xuất bản không tồn tại.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleToggleStatusClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!publisher || !id) return;

    const isCurrentlyActive = publisher.active;
    try {
      setUpdating(true);
      const updatedData = {
        name: publisher.name,
        address: publisher.address || "",
        phone: publisher.phone || "",
        active: !isCurrentlyActive
      };

      const res = await updatePublisher(id, updatedData);
      setPublisher(res);
      toast({
        title: "Thành công",
        description: isCurrentlyActive ? "Đã ngưng hoạt động nhà xuất bản thành công!" : "Đã kích hoạt hoạt động nhà xuất bản thành công!",
      });
    } catch (err) {
      console.error("Error toggling publisher status:", err);
      toast({
        title: "Lỗi",
        description: "Cập nhật trạng thái nhà xuất bản thất bại.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
      setShowConfirmModal(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải thông tin...</p>
      </div>
    );
  }

  if (error || !publisher) {
    return (
      <div className="max-w-[600px] mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy thông tin</h2>
        <p className="text-slate-500 text-sm">{error || "Nhà xuất bản không khả dụng."}</p>
        <Link 
          href="/admin/publishers"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-[#b70011] text-white font-bold text-sm rounded-lg hover:bg-[#b70011]/90 transition-all shadow-md"
        >
          Quay lại danh sách NXB
        </Link>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  return (
    <div className="space-y-8 max-w-[1600px] w-full mx-auto p-6 animate__animated animate__fadeIn font-sans">
      
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/admin/publishers" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#b70011] transition-all bg-white hover:bg-red-50/20 px-3.5 py-2 rounded-lg border border-slate-200/60 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Danh sách NXB</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link 
            href={`/admin/publishers/${id}/edit`} 
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 transition-all px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm active:scale-[0.98] text-decoration-none"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Chỉnh sửa NXB</span>
          </Link>

          <button
            onClick={handleToggleStatusClick}
            disabled={updating}
            className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white transition-all px-4 py-2.5 rounded-lg shadow-md active:scale-[0.98] cursor-pointer border-0 ${
              publisher.active 
                ? "bg-[#b70011] hover:bg-[#b70011]/90 shadow-[#b70011]/10" 
                : "bg-green-600 hover:bg-green-600/90 shadow-green-600/10"
            } disabled:opacity-50`}
          >
            {publisher.active ? (
              <>
                <Ban className="w-3.5 h-3.5" />
                <span>Ngưng hoạt động</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Kích hoạt lại</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg relative overflow-hidden text-white border border-slate-800">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#b70011]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
          {/* Logo Placeholder */}
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-white/10 backdrop-blur-md flex-shrink-0 shadow-2xl border-2 border-white/20 flex items-center justify-center">
             <Building2 className="w-12 h-12 text-slate-300" />
          </div>

          {/* Details */}
          <div className="flex-grow text-center md:text-left space-y-3">
             <div className="flex items-center justify-center md:justify-start gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
               <span>Thông tin nhà xuất bản</span>
               <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
             </div>
             
             <h1 className="text-3xl md:text-4xl font-black tracking-tight">{publisher.name}</h1>
             
             <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6 text-sm text-slate-300">
               {publisher.phone ? (
                 <div className="flex items-center gap-1.5">
                   <Phone className="w-4 h-4 text-slate-400" />
                   <span>{publisher.phone}</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 text-slate-400">
                   <Phone className="w-4 h-4" />
                   <span>Chưa cập nhật số điện thoại</span>
                 </div>
               )}
               
               {publisher.address ? (
                 <div className="flex items-center gap-1.5">
                   <MapPin className="w-4 h-4 text-slate-400" />
                   <span>{publisher.address}</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 text-slate-400">
                   <MapPin className="w-4 h-4" />
                   <span>Chưa cập nhật địa chỉ</span>
                 </div>
               )}

               <div className="flex items-center gap-1.5">
                 <BookOpen className="w-4 h-4 text-slate-400" />
                 <span>{books.length} đầu sách trong hệ thống</span>
               </div>
             </div>

             <div className="pt-2 flex justify-center md:justify-start">
               {publisher.active ? (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                   Đang hợp tác
                 </span>
               ) : (
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                   <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span>
                   Tạm ngưng hợp tác
                 </span>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Publisher Books List & Stats Component */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#b70011]" />
            <h3 className="text-lg font-black text-slate-800">Danh mục sách của {publisher.name}</h3>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {books.length} Đầu Sách
          </span>
        </div>
        
        <PublisherBooksList 
          books={books} 
          publisherName={publisher.name} 
          baseUrl={baseUrl} 
        />
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmToggle}
        title="Xác Nhận Trạng Thái"
        message={publisher?.active 
          ? `Bạn có chắc chắn muốn ngưng hoạt động nhà xuất bản "${publisher.name}"?`
          : `Bạn có chắc chắn muốn kích hoạt hoạt động lại nhà xuất bản "${publisher?.name}"?`
        }
      />
    </div>
  );
}
