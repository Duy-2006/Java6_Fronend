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
    if (!imageUrl) return "https://placehold.co/200x300?text=Preview";
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
          // Nếu chưa chọn NXB nào thì tự động chọn NXB đầu tiên trong danh sách
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
      
      // Gửi duy nhất 1 ID Nhà xuất bản được chọn
      const singlePublisherId = form.publisherIds[0];
      fd.append("publisherIds", String(singlePublisherId));
      fd.append("publisherId", String(singlePublisherId));

      fd.append("categoryId", String(form.categoryId ?? ""));
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

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 shadow-lg mt-3 mb-5">
            <div className="card-header text-white py-3 bg-gradient-to-br from-primary to-primary-dark rounded-t-lg">
              <h5 className="m-0 fw-bold text-uppercase">
                {isEdit ? "Cập Nhật Thông Tin Sách" : "Nhập Sách Mới"}
              </h5>
            </div>

            <div className="card-body p-4 bg-white">
              <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">

                {/* THÔNG TIN CHUNG */}
                <h6 className="text-primary fw-bold mb-3 text-uppercase border-bottom pb-2">Thông tin chung</h6>
                
                <div className="row">
                  {/* Tên sách */}
                  <div className="col-md-8 mb-3">
                    <label className="form-label" htmlFor="title">Tên sách <span className="text-danger">*</span></label>
                    <input
                      id="title"
                      type="text"
                      className={`form-control ${errors.title ? "border-danger" : ""}`}
                      value={form.title}
                      onChange={e => setField("title", e.target.value)}
                      placeholder="Nhập tên sách..."
                      maxLength={200}
                    />
                    <FieldError msg={errors.title} />
                    <div className="d-flex justify-content-end"><small className="text-muted">{form.title.length}/200</small></div>
                  </div>

                  {/* Mã ISBN */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="isbn">Mã ISBN</label>
                    <div className="input-group">
                      <input
                        id="isbn"
                        type="text"
                        className="form-control"
                        value={form.isbn}
                        onChange={e => setField("isbn", e.target.value)}
                        placeholder="Mã vạch..."
                      />
                      {!isEdit && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setField("isbn", generateISBN())}
                        >
                          Tạo mã
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Tác giả */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label font-bold text-gray-700">Tác giả <span className="text-danger">*</span></label>
                    
                    {/* Danh sách đã chọn */}
                    <div className="border rounded-lg p-2 mb-2 bg-gray-50 min-h-[45px] flex flex-wrap gap-1.5 align-items-center">
                      {form.authorIds.length === 0 ? (
                        <span className="text-gray-400 text-xs ps-1">Chưa chọn tác giả nào...</span>
                      ) : (
                        form.authorIds.map(id => {
                          const author = clientAuthors.find(a => a.id === id);
                          if (!author) return null;
                          return (
                            <span key={id} className="inline-flex items-center gap-1 bg-[#b70011]/10 text-[#b70011] border border-[#b70011]/20 px-2.5 py-1 rounded-full text-xs font-bold transition-all hover:bg-[#b70011]/15">
                              {author.name}
                              <button 
                                type="button" 
                                onClick={() => {
                                  const updated = form.authorIds.filter(aid => aid !== id);
                                  setField("authorIds", updated);
                                }}
                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#b70011]/20 border-0 bg-transparent text-[#b70011] font-bold text-[10px] p-0 cursor-pointer"
                                aria-label="Xóa"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* Danh sách lựa chọn */}
                    <div className="border rounded-lg overflow-y-auto max-h-[140px] bg-white divide-y divide-gray-100 shadow-inner">
                      {clientAuthors.filter(a => !form.authorIds.includes(a.id)).length === 0 ? (
                        <div className="text-gray-400 text-xs p-3 text-center">Đã chọn tất cả tác giả</div>
                      ) : (
                        clientAuthors.filter(a => !form.authorIds.includes(a.id)).map(author => (
                          <div 
                            key={author.id}
                            onClick={() => {
                              setField("authorIds", [...form.authorIds, author.id]);
                            }}
                            className="p-2 cursor-pointer hover:bg-gray-50 text-xs transition-colors text-gray-700 flex items-center gap-1.5"
                          >
                            <span className="text-green-600 font-bold text-sm">+</span>
                            <span>{author.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <FieldError msg={errors.authorIds} />
                  </div>

                  {/* CHỌN DUY NHẤT 1 NHÀ XUẤT BẢN */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label font-bold text-gray-700" htmlFor="publisherSelect">
                      Nhà xuất bản <span className="text-danger">*</span>
                    </label>
                    <select
                      id="publisherSelect"
                      className={`form-select ${errors.publisherIds ? "border-danger" : ""}`}
                      value={selectedPublisherId}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setField("publisherIds", val ? [val] : []);
                      }}
                    >
                      <option value="">-- Chọn 1 Nhà xuất bản --</option>
                      {clientPublishers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <FieldError msg={errors.publisherIds} />
                  </div>

                  {/* Thể loại */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="categoryId">Thể loại</label>
                    <select id="categoryId" className="form-select" value={form.categoryId} onChange={e => setField("categoryId", e.target.value)}>
                      <option value="">-- Chọn thể loại --</option>
                      {clientCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* DỮ LIỆU KINH DOANH */}
                <h6 className="text-primary fw-bold mb-3 mt-4 text-uppercase border-bottom pb-2">Dữ liệu Kinh doanh</h6>
                <div className="row">
                  {/* Giá bán */}
                  <div className="col-md-3 mb-3">
                    <label className="form-label" htmlFor="price">Giá bán <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input
                        id="price"
                        type="number"
                        className={`form-control fw-bold text-end text-danger ${errors.price ? "border-danger" : ""}`}
                        value={form.price}
                        onChange={e => setField("price", e.target.value)}
                        min={0}
                        step={1000}
                      />
                      <span className="input-group-text bg-light fw-bold">VNĐ</span>
                    </div>
                    <FieldError msg={errors.price} />
                  </div>

                  {/* Số lượng tồn kho */}
                  <div className="col-md-3 mb-3">
                    <label className="form-label" htmlFor="quantity">Số lượng tồn kho <span className="text-danger">*</span></label>
                    <input
                      id="quantity"
                      type="number"
                      className={`form-control fw-bold ${errors.quantity ? "border-danger" : ""}`}
                      value={form.quantity}
                      onChange={e => setField("quantity", e.target.value)}
                      min={0}
                    />
                    <FieldError msg={errors.quantity} />
                  </div>

                  {/* Trạng thái */}
                  <div className="col-md-3 mb-3">
                    <div className="form-check form-switch mt-4 ps-5">
                      <input
                        className="form-check-input scale-[1.3]"
                        type="checkbox"
                        role="switch"
                        id="activeSwitch"
                        checked={form.active}
                        onChange={e => setField("active", e.target.checked)}
                      />
                      <label className="form-check-label fw-bold ms-2 text-success" htmlFor="activeSwitch">Đang kinh doanh</label>
                    </div>
                  </div>
                </div>

                {/* HÌNH ẢNH & NỘI DUNG */}
                <h6 className="text-primary fw-bold mb-3 mt-4 text-uppercase border-bottom pb-2">Hình ảnh & Nội dung</h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="imageFile">Ảnh bìa (JPG/PNG, tối đa 5MB)</label>
                    <input id="imageFile" type="file" ref={fileRef} className="form-control" accept="image/*" onChange={handleFileChange} />
                    <div className="mt-3 text-center border rounded p-2 bg-light d-flex align-items-center justify-content-center min-h-[200px]">
                      <img
                        src={preview}
                        alt="Preview"
                        className="img-fluid rounded shadow-sm max-h-[250px] object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x300?text=Preview"; }}
                      />
                    </div>
                  </div>
                  <div className="col-md-8 mb-3">
                    <label className="form-label" htmlFor="description">Mô tả chi tiết</label>
                    <textarea
                      id="description"
                      className="form-control"
                      rows={10}
                      value={form.description}
                      onChange={e => setField("description", e.target.value)}
                      placeholder="Viết mô tả về nội dung sách..."
                    />
                    <div className="d-flex justify-content-end"><small className="text-muted">{(form.description ?? "").length} ký tự</small></div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="d-flex gap-2 justify-content-end pt-3 border-top">
                  <a href="/admin/books" className="btn btn-light border fw-bold px-4">Hủy bỏ</a>
                  <button type="submit" disabled={loading} className="btn btn-primary fw-bold px-4 shadow-sm cursor-pointer">
                    {loading ? "Đang lưu..." : "Lưu Sách"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}