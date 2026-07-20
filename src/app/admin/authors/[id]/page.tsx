'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, Sparkles, User, Mail, Award, BookOpen } from "lucide-react";
import { getAuthorById, Author } from "@/services/authorsService";
import { getAllBooks, Book } from "@/services/booksService";
import AuthorBooksList from "../_components/AuthorBooksList";

export default function AuthorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idStr = params?.id as string;
  const id = idStr ? Number(idStr) : null;

  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Mã tác giả không hợp lệ.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const authorData = await getAuthorById(id as number);
        setAuthor(authorData);

        try {
          const allBooks = await getAllBooks();
          const filtered = allBooks.filter((book: any) => 
            book.authorIds?.includes(id as number) || book.authorId === (id as number)
          );
          setBooks(filtered);
        } catch (err) {
          console.error("Error loading books for author:", err);
        }
      } catch (err) {
        console.error("Error loading author:", err);
        setError("Không tìm thấy thông tin tác giả hoặc tác giả không tồn tại.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải thông tin...</p>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="max-w-[600px] mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy thông tin</h2>
        <p className="text-slate-500 text-sm">{error || "Tác giả không khả dụng."}</p>
        <Link 
          href="/admin/authors"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-[#b70011] text-white font-bold text-sm rounded-lg hover:bg-[#b70011]/90 transition-all shadow-md"
        >
          Quay lại danh sách tác giả
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
          href="/admin/authors" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#b70011] transition-all bg-white hover:bg-red-50/20 px-3.5 py-2 rounded-lg border border-slate-200/60 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Danh sách tác giả</span>
        </Link>

        <Link 
          href={`/admin/authors/${id}/edit`} 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#b70011] hover:bg-[#b70011]/90 transition-all px-4 py-2.5 rounded-lg shadow-md shadow-[#b70011]/10 hover:shadow-[#b70011]/25 active:scale-[0.98]"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Chỉnh sửa tác giả</span>
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg relative overflow-hidden text-white border border-slate-800">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#b70011]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-8 z-10">
          {/* Avatar Placeholder */}
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-white/10 backdrop-blur-md flex-shrink-0 shadow-2xl border-2 border-white/20 flex items-center justify-center">
             <User className="w-12 h-12 text-slate-300" />
          </div>

          {/* Details */}
          <div className="flex-grow text-center md:text-left space-y-3">
             <div className="flex items-center justify-center md:justify-start gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
               <Award className="w-4 h-4" />
               <span>Thông tin tác giả</span>
               <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
             </div>
             
             <h1 className="text-3xl md:text-4xl font-black tracking-tight">{author.name}</h1>
             
             <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6 text-sm text-slate-300">
               {author.email ? (
                 <div className="flex items-center gap-1.5">
                   <Mail className="w-4 h-4 text-slate-400" />
                   <span>{author.email}</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 text-slate-400">
                   <Mail className="w-4 h-4" />
                   <span>Chưa cập nhật email</span>
                 </div>
               )}
               <div className="flex items-center gap-1.5">
                 <BookOpen className="w-4 h-4 text-slate-400" />
                 <span>{books.length} tác phẩm trong hệ thống</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Author Books List & Stats Component */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#b70011]" />
            <h3 className="text-lg font-black text-slate-800">Tác phẩm của {author.name}</h3>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {books.length} Tác phẩm
          </span>
        </div>
        
        <AuthorBooksList 
          books={books} 
          authorName={author.name} 
          baseUrl={baseUrl} 
        />
      </div>

    </div>
  );
}
