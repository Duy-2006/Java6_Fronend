"use client";
import { authFetch } from "@/lib/authFetch";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import FieldError from "@/components/layout/FieldError";

interface Author { id: number; name: string }
interface Publisher { id: number; name: string }
interface Category { id: number; name: string }

interface Book {
  id?: number | null; 
  title: string; 
  isbn?: string;
  authorIds: number[];    
  publisherIds: number[]; 
  categoryId?: number | string;
  price: number | string; 
  quantity: number | string; 
  active: boolean;
  description?: string; 
  imageUrl?: string;
}

interface BookFormProps { 
  book?: any; 
  authors: Author[]; 
  publishers: Publisher[]; 
  categories: Category[] 
}

const generateISBN = () => {
  const prefix = "978";
  const random = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  const digits = (prefix + random).split("").map(Number);
  const checksum = (10 - (digits.reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0) % 10)) % 10;
  return `${prefix}-${random.slice(0, 1)}-${random.slice(1, 6)}-${random.slice(6)}-${checksum}`;
};

export default function BookForm({ book, authors, publishers, categories }: BookFormProps) {
  const isEdit = !!book?.id;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  const getFullImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("books/")) return `${API_BASE}/uploads/${imageUrl}`;
    return `${API_BASE}/uploads/books/${imageUrl}`;
  };

  // Client-side state for dropdowns
  const [clientAuthors, setClientAuthors] = useState<Author[]>(authors || []);
  const [clientPublishers, setClientPublishers] = useState<Publisher[]>(publishers || []);
  const [clientCategories, setClientCategories] = useState<Category[]>(categories || []);

  const [form, setForm] = useState<Book>({
    id: book?.id ?? null,
    title: book?.title ?? "",
    isbn: book?.isbn ?? (!book?.id ? generateISBN() : ""),
    authorIds: book?.authorIds ?? (book?.authors ? book.authors.map((a: any) => a.id) : (book?.authorId ? [Number(book.authorId)] : [])),
    publisherIds: book?.publisherIds && book.publisherIds.length > 0 
      ? [book.publisherIds[0]] 
      : (book?.publishers && book.publishers.length > 0 ? [book.publishers[0].id] : []),
    categoryId: book?.categoryId ?? "",
    price: book?.price ?? "",
    quantity: book?.quantity ?? 0,
    active: book?.active ?? true,
    description: book?.description ?? "",
    imageUrl: book?.imageUrl ?? "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const [preview, setPreview] = useState<string>(getFullImageUrl(book?.imageUrl));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, pRes, cRes] = await Promise.all([
          authFetch(`${API_BASE}/api/admin/authors`),
          authFetch(`${API_BASE}/api/admin/publishers`),
          authFetch(`${API_BASE}/api/admin/categories`)
        ]);
        if (aRes.ok) setClientAuthors(await aRes.json());
        if (pRes.ok) {
          const fetchedPubs: Publisher[] = await pRes.json();
          setClientPublishers(fetchedPubs);
          if (fetchedPubs.length > 0 && form.publisherIds.length === 0) {
            setForm(f => ({ ...f, publisherIds: [fetchedPubs[0].id] }));
          }
        }
        if (cRes.ok) setClientCategories(await cRes.json());
      } catch (error) {
        console.error("Lỗi fetch dữ liệu form:", error);
      }
    };
    
    if (clientAuthors.length === 0 || clientPublishers.length === 0 || clientCategories.length === 0) {
      fetchData();
    }
  }, []);

  const setField = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { alert("Vui lòng chọn file ảnh hợp lệ."); return; }
      if (file.size > 5 * 1024 * 1024) { alert("Ảnh không được vượt quá 5MB."); return; }
      setPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const tempErrors: { [key: string]: string | undefined } = {};
    if (!form.title.trim()) tempErrors.title = "Tên sách không được để trống.";
    if (form.authorIds.length === 0) tempErrors.authorIds = "Vui lòng chọn ít nhất một tác giả.";
    if (form.publisherIds.length === 0 || !form.publisherIds[0]) tempErrors.publisherIds = "Vui lòng chọn nhà xuất bản.";
    if (!String(form.price).trim() || Number(form.price) < 0) tempErrors.price = "Giá bán hợp lệ và không được để trống.";
    if (!String(form.quantity).trim() || Number(form.quantity) < 0) tempErrors.quantity = "Số lượng tồn kho phải từ 0 trở lên.";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      if (form.id) fd.append("id", String(form.id));
      fd.append("title", form.title);
      fd.append("isbn", form.isbn ?? "");
      form.authorIds.forEach(id => fd.append("authorIds", String(id)));
      
      const singlePublisherId = form.publisherIds[0];
      fd.append("publisherIds", String(singlePublisherId));
      fd.append("publisherId", String(singlePublisherId));

      if (form.categoryId) {
        fd.append("categoryId", String(form.categoryId));
      }
      fd.append("price", String(form.price));
      fd.append("quantity", String(form.quantity));
      fd.append("active", String(form.active));
      fd.append("description", form.description ?? "");
      if (fileRef.current?.files?.[0]) fd.append("imageFile", fileRef.current.files[0]);

      const url = isEdit ? `${API_BASE}/api/admin/books/${form.id}` : `${API_BASE}/api/admin/books`;
      const res = await authFetch(url, { method: isEdit ? "PUT" : "POST", body: fd });

      if (res.ok) {
        const successMsg = isEdit ? "Cập nhật sách thành công." : "Thêm sách mới thành công.";
        router.push(`/admin/books?success=${encodeURIComponent(successMsg)}`);
        router.refresh();
      } else {
        alert(`Có lỗi từ server (${res.status}). Vui lòng thử lại.`);
      }
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPublisherId = form.publisherIds.length > 0 ? form.publisherIds[0] : "";

  const toggleAuthorSelection = (authorId: number) => {
    const exists = form.authorIds.includes(authorId);
    let updated: number[];
    if (exists) {
      updated = form.authorIds.filter(id => id !== authorId);
    } else {
      updated = [...form.authorIds, authorId];
    }
    setField("authorIds", updated);
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg min-h-screen">
      {/* Top Breadcrumb */}
      <div className="text-xs text-gray-400 font-normal mb-6">
        <span>Dashboard</span> / <span className="text-gray-600">Sách</span>
      </div>

      <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
        
        {/* ══════════════════════════════════════
           SECTION 1: THÔNG TIN CHUNG
        ══════════════════════════════════════ */}
        <div className="mb-8">
          <h6 className="text-[#2563eb] font-bold text-xs tracking-wider uppercase mb-5">
            THÔNG TIN CHUNG
          </h6>

          <div className="grid grid-cols-12 gap-6">
            {/* Tên sách */}
            <div className="col-span-12 md:col-span-8">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="title">
                Tên sách <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`w-full bg-[#f8fafc] border border-slate-200 rounded-md text-xs px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors ${errors.title ? "border-red-500" : ""}`}
                value={form.title}
                onChange={e => setField("title", e.target.value)}
                placeholder="Nhập tên sách..."
                maxLength={200}
              />
              <FieldError msg={errors.title} />
              <div className="flex justify-end mt-1">
                <small className="text-gray-400 text-[11px]">{form.title.length}/200</small>
              </div>
            </div>

            {/* Mã ISBN */}
            <div className="col-span-12 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="isbn">
                Mã ISBN
              </label>
              <div className="flex">
                <input
                  id="isbn"
                  type="text"
                  className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-l-md text-xs px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={form.isbn}
                  onChange={e => setField("isbn", e.target.value)}
                  placeholder="978-1-50072-569-3"
                />
                {!isEdit && (
                  <button
                    type="button"
                    className="bg-white border border-l-0 border-slate-200 hover:bg-gray-50 text-gray-700 text-xs px-3.5 rounded-r-md font-normal transition-colors cursor-pointer"
                    onClick={() => setField("isbn", generateISBN())}
                  >
                    Tạo mã
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mt-4">
            {/* Tác giả */}
            <div className="col-span-12 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Tác giả <span className="text-red-500">*</span>
              </label>
              
              {/* Display Box for Selected / Placeholder */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-md text-xs px-3 py-2 text-gray-400 mb-2 min-h-[38px] flex items-center">
                {form.authorIds.length === 0 ? (
                  <span>Chưa chọn tác giả nào...</span>
                ) : (
                  <span className="text-gray-700 font-medium">
                    Đã chọn {form.authorIds.length} tác giả
                  </span>
                )}
              </div>

              {/* Scrollable list box matching screenshot */}
              <div className="border border-slate-200 rounded-md bg-white p-2.5 max-h-[140px] overflow-y-auto space-y-1.5 shadow-inner">
                {clientAuthors.length === 0 ? (
                  <div className="text-gray-400 text-xs py-1 italic">Đang tải danh sách tác giả...</div>
                ) : (
                  clientAuthors.map(author => {
                    const isSelected = form.authorIds.includes(author.id);
                    return (
                      <div
                        key={author.id}
                        onClick={() => toggleAuthorSelection(author.id)}
                        className={`flex items-center gap-2 text-xs py-1 px-1.5 rounded cursor-pointer transition-colors ${isSelected ? "text-blue-600 font-semibold bg-blue-50/60" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span className={`text-[13px] ${isSelected ? "text-blue-600 font-bold" : "text-gray-500"}`}>•</span>
                        <span>{author.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
              <FieldError msg={errors.authorIds} />
            </div>

            {/* Nhà xuất bản */}
            <div className="col-span-12 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="publisherSelect">
                Nhà xuất bản <span className="text-red-500">*</span>
              </label>
              <select
                id="publisherSelect"
                className={`w-full bg-[#f8fafc] border border-slate-200 rounded-md text-xs px-3 py-2.5 text-gray-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors ${errors.publisherIds ? "border-red-500" : ""}`}
                value={selectedPublisherId}
                onChange={e => {
                  const val = Number(e.target.value);
                  setField("publisherIds", val ? [val] : []);
                }}
              >
                <option value="">Nhà xuất bản Tri Thức Xanh</option>
                {clientPublishers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.publisherIds} />
            </div>

            {/* Thể loại */}
            <div className="col-span-12 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="categoryId">
                Thể loại
              </label>
              <select 
                id="categoryId" 
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-md text-xs px-3 py-2.5 text-gray-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors" 
                value={form.categoryId} 
                onChange={e => setField("categoryId", e.target.value)}
              >
                <option value="">- Chọn thể loại -</option>
                {clientCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
           SECTION 2: DỮ LIỆU KINH DOANH
        ══════════════════════════════════════ */}
        <div className="mb-8 pt-4 border-t border-slate-100">
          <h6 className="text-[#2563eb] font-bold text-xs tracking-wider uppercase mb-5">
            DỮ LIỆU KINH DOANH
          </h6>

          <div className="grid grid-cols-12 gap-6 items-end">
            {/* Giá bán */}
            <div className="col-span-12 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="price">
                Giá bán <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  id="price"
                  type="number"
                  className={`flex-1 bg-[#f8fafc] border border-slate-200 rounded-l-md text-xs px-3 py-2.5 text-gray-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors ${errors.price ? "border-red-500" : ""}`}
                  value={form.price}
                  onChange={e => setField("price", e.target.value)}
                  min={0}
                  step={1000}
                  placeholder="0"
                />
                <span className="bg-[#f1f5f9] border border-l-0 border-slate-200 text-gray-500 text-xs px-3.5 py-2.5 rounded-r-md font-medium flex items-center">
                  VNĐ
                </span>
              </div>
              <FieldError msg={errors.price} />
            </div>

            {/* Số lượng tồn kho */}
            <div className="col-span-12 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="quantity">
                Số lượng tồn kho <span className="text-red-500">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                className={`w-full bg-[#f8fafc] border border-slate-200 rounded-md text-xs px-3 py-2.5 text-gray-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors ${errors.quantity ? "border-red-500" : ""}`}
                value={form.quantity}
                onChange={e => setField("quantity", e.target.value)}
                min={0}
                placeholder="0"
              />
              <FieldError msg={errors.quantity} />
            </div>

            {/* Trạng thái (Toggle Switch) */}
            <div className="col-span-12 md:col-span-4 pb-1">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.active}
                    onChange={e => setField("active", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
                </label>
                <span className="text-xs font-bold text-[#2563eb]">
                  Đang kinh doanh
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
           SECTION 3: HÌNH ẢNH & NỘI DUNG
        ══════════════════════════════════════ */}
        <div className="mb-8 pt-4 border-t border-slate-100">
          <h6 className="text-[#2563eb] font-bold text-xs tracking-wider uppercase mb-5">
            HÌNH ẢNH & NỘI DUNG
          </h6>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Image Upload & Gray Box */}
            <div className="col-span-12 md:col-span-5">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="imageFile">
                Ảnh bìa (JPG/PNG, tối đa 5MB)
              </label>
              
              <div className="flex items-center gap-2 mb-3">
                <input 
                  id="imageFile" 
                  type="file" 
                  ref={fileRef} 
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>

              {/* Large Gray Placeholder Box matching screenshot */}
              <div className="w-full h-44 bg-[#e2e8f0] rounded-xl flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain p-2"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="text-gray-400 text-xs"></div>
                )}
              </div>
            </div>

            {/* Right Column: Description */}
            <div className="col-span-12 md:col-span-7">
              <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="description">
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-md text-xs p-3 text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                rows={7}
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                placeholder="Viết mô tả về nội dung sách..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <a href="/admin/books" className="bg-white border border-slate-200 text-gray-600 text-xs font-medium px-5 py-2.5 rounded-md hover:bg-gray-50 transition-colors">
            Hủy bỏ
          </a>
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-medium px-6 py-2.5 rounded-md shadow-sm transition-colors border-0 cursor-pointer"
          >
            {loading ? "Đang lưu..." : isEdit ? "Cập nhật sách" : "Lưu Sách"}
          </button>
        </div>

      </form>
    </div>
  );
}