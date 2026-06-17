"use client";
import { authFetch } from "@/lib/authFetch";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateBook } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";

interface Author { id: number; name: string }
interface Category { id: number; name: string }
interface Book {
  id?: number | null; title: string; isbn?: string;
  authorId?: number | string; publisher?: string; categoryId?: number | string;
  price: number | string; audioPrice?: number | string; quantity: number | string; active: boolean;
  description?: string; imageUrl?: string;
}

interface BookFormProps { book?: Book; authors: Author[]; categories: Category[] }

const generateISBN = () => {
  const prefix = "978";
  const random = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  const digits = (prefix + random).split("").map(Number);
  const checksum = (10 - (digits.reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0) % 10)) % 10;
  return `${prefix}-${random.slice(0, 1)}-${random.slice(1, 6)}-${random.slice(6)}-${checksum}`;
};

export default function BookForm({ book, authors, categories }: BookFormProps) {
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

  const [form, setForm] = useState<Book>({
    id: book?.id ?? null,
    title: book?.title ?? "",
    isbn: book?.isbn ?? (!book?.id ? generateISBN() : ""),
    authorId: book?.authorId ?? "",
    publisher: book?.publisher ?? "",
    categoryId: book?.categoryId ?? "",
    price: book?.price ?? "",
    audioPrice: book?.audioPrice ?? "",
    quantity: book?.quantity ?? 0,
    active: book?.active ?? true,
    description: book?.description ?? "",
    imageUrl: book?.imageUrl ?? "",
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateBook>>({});
  const [preview, setPreview] = useState<string>(getFullImageUrl(book?.imageUrl));
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && !form.id) { alert("Không tìm thấy ID sách. Vui lòng tải lại trang."); return; }

    const errs = validateBook({
      title: form.title,
      isbn: form.isbn,
      price: form.price,
      quantity: String(form.quantity),
    });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      if (form.id) fd.append("id", String(form.id));
      fd.append("title", form.title);
      fd.append("isbn", form.isbn ?? "");
      fd.append("authorId", String(form.authorId ?? ""));
      fd.append("publisher", form.publisher ?? "");
      fd.append("categoryId", String(form.categoryId ?? ""));
      fd.append("price", String(form.price));
      if (form.audioPrice) fd.append("audioPrice", String(form.audioPrice));
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
        const errorText = await res.text();
        console.error("Server error:", errorText);
        alert(`Có lỗi từ server (${res.status}). Vui lòng thử lại.`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 shadow-lg mt-3 mb-5">
            <div className="card-header text-white py-3 bg-gradient-to-br from-primary to-primary-dark rounded-t-lg">
              <h5 className="m-0 fw-bold text-uppercase d-flex align-items-center">
                {isEdit ? <i className="fa-solid fa-pen-to-square me-2" /> : <i className="fa-solid fa-book-medical me-2" />}
                {isEdit ? "Cập Nhật Thông Tin Sách" : "Nhập Sách Mới"}
              </h5>
            </div>

            <div className="card-body p-4 bg-white">
              <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">

                {/* Thông tin chung */}
                <h6 className="text-primary fw-bold mb-3 text-uppercase border-bottom pb-2">
                  <i className="fa-solid fa-circle-info me-1" /> Thông tin chung
                </h6>
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label" htmlFor="title">Tên sách <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="fa-solid fa-book text-muted" /></span>
                      <input
                        id="title"
                        type="text"
                        className={`form-control ${errors.title ? "border-danger" : ""}`}
                        value={form.title}
                        onChange={e => setField("title", e.target.value)}
                        onBlur={() => setErrors(v => ({ ...v, ...validateBook({ title: form.title, price: form.price, quantity: String(form.quantity) }) }))}
                        placeholder="Nhập tên sách..."
                        maxLength={200}
                      />
                    </div>
                    <FieldError msg={errors.title} />
                    <div className="d-flex justify-content-end"><small className="text-muted">{form.title.length}/200</small></div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="isbn">Mã ISBN</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="fa-solid fa-barcode text-muted" /></span>
                      <input
                        id="isbn"
                        type="text"
                        className={`form-control ${errors.isbn ? "border-danger" : ""}`}
                        value={form.isbn}
                        onChange={e => setField("isbn", e.target.value)}
                        placeholder="Mã vạch..."
                      />
                      {!isEdit && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Tạo mã ISBN tự động"
                          onClick={() => setField("isbn", generateISBN())}
                        >
                          <i className="fa-solid fa-rotate-right" />
                        </button>
                      )}
                    </div>
                    <FieldError msg={errors.isbn} />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="authorId">Tác giả</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="fa-solid fa-user-pen text-muted" /></span>
                      <select id="authorId" className="form-select" value={form.authorId} onChange={e => setField("authorId", e.target.value)}>
                        <option value="">-- Chọn tác giả --</option>
                        {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="publisher">Nhà xuất bản</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="fa-solid fa-building text-muted" /></span>
                      <input
                        id="publisher"
                        type="text"
                        className="form-control"
                        value={form.publisher}
                        onChange={e => setField("publisher", e.target.value)}
                        placeholder="NXB..."
                      />
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="categoryId">Thể loại</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="fa-solid fa-layer-group text-muted" /></span>
                      <select id="categoryId" className="form-select" value={form.categoryId} onChange={e => setField("categoryId", e.target.value)}>
                        <option value="">-- Chọn thể loại --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dữ liệu Kinh doanh */}
                <h6 className="text-primary fw-bold mb-3 mt-2 text-uppercase border-bottom pb-2">
                  <i className="fa-solid fa-sack-dollar me-1" /> Dữ liệu Kinh doanh
                </h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="price">Giá bán <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input
                        id="price"
                        type="number"
                        className={`form-control fw-bold text-end text-danger ${errors.price ? "border-danger" : ""}`}
                        value={form.price}
                        onChange={e => setField("price", e.target.value)}
                        onBlur={() => setErrors(v => ({ ...v, ...validateBook({ title: form.title, price: form.price, quantity: String(form.quantity) }) }))}
                        min={0}
                        step={1000}
                      />
                      <span className="input-group-text bg-light fw-bold">VNĐ</span>
                    </div>
                    <FieldError msg={errors.price} />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="quantity">
                      Số lượng tồn kho <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light"><i className="fa-solid fa-boxes-stacked text-muted" /></span>
                      <input
                        id="quantity"
                        type="number"
                        className={`form-control fw-bold ${errors.quantity ? "border-danger" : ""}`}
                        value={form.quantity}
                        onChange={e => setField("quantity", e.target.value)}
                        min={0}
                      />
                    </div>
                    <FieldError msg={errors.quantity} />
                  </div>

                  <div className="col-md-4 mb-3">
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

                {/* Hình ảnh & Nội dung */}
                <h6 className="text-primary fw-bold mb-3 mt-2 text-uppercase border-bottom pb-2">
                  <i className="fa-solid fa-image me-1" /> Hình ảnh & Nội dung
                </h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label" htmlFor="imageFile">Ảnh bìa <small className="text-muted">(JPG/PNG, tối đa 5MB)</small></label>
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

                <div className="d-flex gap-2 justify-content-end pt-3 border-top">
                  <a href="/admin/books" className="btn btn-light border fw-bold px-4">
                    <i className="fa-solid fa-arrow-left me-1" /> Hủy bỏ
                  </a>
                  <button type="submit" disabled={loading} className="btn btn-primary fw-bold px-4 shadow-sm">
                    <i className="fa-solid fa-floppy-disk me-1" />
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
