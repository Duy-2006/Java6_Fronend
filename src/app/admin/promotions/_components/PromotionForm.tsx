"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validatePromotion } from "@/services/validation";
import FieldError from "@/components/layout/FieldError";
import { createPromotion, updatePromotion } from "@/services/promotionServices";

interface Book     { id: number; title: string }
interface Category { id: number; name:  string }
interface Promotion {
  id?: number;
  name?: string;
  discountValue?: number | string;
  startDate?: string;
  endDate?: string;
  applyType?: string;
  bookIds?: number[];
  categoryIds?: number[];
}

interface Props {
  promotion?: Promotion;
  books: Book[];
  categories: Category[];
  selectedBookIds?: number[];
  selectedCategoryIds?: number[];
}

export default function PromotionForm({
  promotion,
  books,
  categories,
  selectedBookIds = [],
  selectedCategoryIds = [],
}: Props) {
  const isEdit = !!promotion?.id;
  const router = useRouter();

  const [form, setForm] = useState({
    name:          promotion?.name          ?? "",
    discountValue: promotion?.discountValue ?? "",
    startDate:     promotion?.startDate     ?? "",
    endDate:       promotion?.endDate       ?? "",
    applyType:     promotion?.applyType     ?? "ALL",
  });
  const [selBooks,          setSelBooks]          = useState<Set<number>>(new Set(selectedBookIds));
  const [selCats,           setSelCats]           = useState<Set<number>>(new Set(selectedCategoryIds));
  const [bookSearch,        setBookSearch]        = useState("");
  const [catSearch,         setCatSearch]         = useState("");
  const [allBooksSelected,  setAllBooksSelected]  = useState(false);
  const [allCatsSelected,   setAllCatsSelected]   = useState(false);
  const [errors,            setErrors]            = useState<ReturnType<typeof validatePromotion>>({});
  const [loading,           setLoading]           = useState(false);
  const [serverError,       setServerError]       = useState("");

  const set = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const toggle = (s: Set<number>, id: number) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setServerError("");

  const errs = validatePromotion({ ...form, selBooks: selBooks.size, selCats: selCats.size });
  if (Object.keys(errs).length > 0) { setErrors(errs); return; }

  const token =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token")      ||
    "";

  if (!token) {
    setServerError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
    return;
  }

  setLoading(true);
  try {
    // ✅ Extract ra biến trước để TypeScript suy luận đúng kiểu
    const bookIds:     number[] = form.applyType === "BOOK"     ? Array.from(selBooks) : [];
    const categoryIds: number[] = form.applyType === "CATEGORY" ? Array.from(selCats)  : [];

    // ✅ Cast applyType về đúng union type
    const applyType = form.applyType as "ALL" | "BOOK" | "CATEGORY";

    const payload = {
      name:          form.name,
      discountValue: Number(form.discountValue),
      startDate:     form.startDate || undefined,
      endDate:       form.endDate   || undefined,
      applyType,
      status:        true,
      bookIds,
      categoryIds,
    };

    if (isEdit) {
      await updatePromotion(promotion!.id!, payload, token);
    } else {
      await createPromotion(payload, token);
    }

    router.push("/admin/promotions");
    router.refresh();
  } catch (err: any) {
    setServerError(err.message || "Có lỗi từ server. Vui lòng thử lại.");
  } finally {
    setLoading(false);
  }
};

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase())
  );
  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        .promo-wrapper{display:flex;gap:24px;margin-top:32px;padding:0 16px 32px;font-family:'Be Vietnam Pro',sans-serif;align-items:flex-start}
        .promo-left{flex:0 0 420px}
        .promo-card{background:#fff;width:100%;padding:32px 28px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #f0f0f0}
        .promo-card h3{text-align:center;margin:0 0 28px;font-size:19px;font-weight:700;color:#111827}
        .pf-group{margin-bottom:16px}
        .pf-label{font-size:13px;font-weight:600;margin-bottom:6px;display:block;color:#374151}
        .pf-input{width:100%;padding:10px 13px;border-radius:9px;border:1.5px solid #e5e7eb;font-size:14px;color:#111827;background:#fafafa;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;font-family:inherit}
        .pf-input:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);background:#fff}
        .pf-input.error{border-color:#c0392b !important}
        .pf-date-row{display:flex;gap:12px}
        .pf-date-row .pf-group{flex:1}
        .pf-submit{width:100%;margin-top:20px;padding:13px;background:${isEdit ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "linear-gradient(135deg,#6366f1,#22c55e)"};border:none;border-radius:10px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .2s}
        .pf-submit:hover{opacity:.92}
        .pf-submit:disabled{opacity:.6;cursor:not-allowed}
        .pf-cancel{display:block;width:100%;margin-top:10px;padding:11px;background:#f3f4f6;border:none;border-radius:10px;color:#6b7280;font-size:14px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;transition:background .2s;font-family:inherit}
        .pf-cancel:hover{background:#e5e7eb;color:#374151}
        .pf-note{text-align:center;font-size:12px;color:#9ca3af;margin-top:12px;line-height:1.5}
        .pf-error-box{background:#fee2e2;color:#991b1b;padding:10px 14px;border-radius:9px;font-size:13px;margin-bottom:14px;border:1px solid #fca5a5}
        .promo-right{flex:1;min-width:0}
        .selection-panel{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #f0f0f0;padding:28px}
        .selection-panel h4{font-size:16px;font-weight:700;color:#111827;margin:0 0 16px;display:flex;align-items:center;gap:8px}
        .sp-badge{background:#6366f1;color:#fff;font-size:11px;padding:2px 9px;border-radius:20px;font-weight:600}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:260px;color:#9ca3af;gap:14px}
        .empty-state p{font-size:14px;text-align:center;line-height:1.6}
        .search-box{width:100%;padding:9px 13px;border-radius:9px;border:1.5px solid #e5e7eb;font-size:14px;margin-bottom:12px;background:#fafafa;box-sizing:border-box;font-family:inherit}
        .search-box:focus{outline:none;border-color:#6366f1}
        .select-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .select-bar .count{font-size:13px;color:#6b7280;font-weight:500}
        .select-all-btn{font-size:13px;color:#6366f1;font-weight:600;cursor:pointer;background:none;border:none;padding:0;font-family:inherit}
        .item-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:9px;max-height:380px;overflow-y:auto;padding-right:4px}
        .item-card{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;border:1.5px solid #e5e7eb;cursor:pointer;transition:border-color .15s,background .15s;user-select:none}
        .item-card:hover{border-color:#a5b4fc;background:#f5f3ff}
        .item-card.selected{border-color:#6366f1;background:#eef2ff}
        .item-card input[type=checkbox]{accent-color:#6366f1;width:15px;height:15px;flex-shrink:0;pointer-events:none}
        .item-label{font-size:13.5px;font-weight:500;color:#1f2937;line-height:1.4}
      `}</style>

      <div className="promo-wrapper">
        {/* LEFT */}
        <div className="promo-left">
          <div className="promo-card">
            <h3>{isEdit ? "Chỉnh sửa khuyến mãi" : "Tạo chương trình khuyến mãi"}</h3>

            {/* Lỗi từ server */}
            {serverError && (
              <div className="pf-error-box">⚠️ {serverError}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              <div className="pf-group">
                <label className="pf-label">
                  Tên khuyến mãi <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  className={`pf-input ${errors.name ? "error" : ""}`}
                  type="text"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="VD: Sale hè 2026"
                  maxLength={100}
                />
                <FieldError msg={errors.name} />
                <div style={{ textAlign: "right", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {form.name.length}/100
                </div>
              </div>

              <div className="pf-group">
                <label className="pf-label">
                  Giá trị giảm (%) <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  className={`pf-input ${errors.discountValue ? "error" : ""}`}
                  type="number"
                  value={form.discountValue}
                  onChange={e => set("discountValue", e.target.value)}
                  placeholder="VD: 10"
                  min={1}
                  max={100}
                />
                <FieldError msg={errors.discountValue} />
              </div>

              <div className="pf-date-row">
                <div className="pf-group">
                  <label className="pf-label">
                    Ngày bắt đầu <span style={{ color: "#c0392b" }}>*</span>
                  </label>
                  <input
                    className={`pf-input ${errors.startDate ? "error" : ""}`}
                    type="date"
                    value={form.startDate}
                    onChange={e => set("startDate", e.target.value)}
                  />
                  <FieldError msg={errors.startDate} />
                </div>
                <div className="pf-group">
                  <label className="pf-label">
                    Ngày kết thúc <span style={{ color: "#c0392b" }}>*</span>
                  </label>
                  <input
                    className={`pf-input ${errors.endDate ? "error" : ""}`}
                    type="date"
                    value={form.endDate}
                    onChange={e => set("endDate", e.target.value)}
                  />
                  <FieldError msg={errors.endDate} />
                </div>
              </div>

              <div className="pf-group">
                <label className="pf-label">Áp dụng cho</label>
                <select
                  className="pf-input"
                  value={form.applyType}
                  onChange={e => set("applyType", e.target.value)}
                >
                  <option value="ALL">Toàn sàn</option>
                  <option value="BOOK">Theo sách</option>
                  <option value="CATEGORY">Theo thể loại</option>
                </select>
                <FieldError msg={errors.applyType} />
              </div>

              <button type="submit" className="pf-submit" disabled={loading}>
                {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo khuyến mãi"}
              </button>
              <a href="/admin/promotions" className="pf-cancel">Hủy</a>
              <p className="pf-note">
                Nếu không chọn sách hoặc thể loại → hệ thống hiểu là áp dụng toàn bộ
              </p>
            </form>
          </div>
        </div>

        {/* RIGHT */}
        <div className="promo-right">
          <div className="selection-panel">
            {form.applyType === "ALL" && (
              <div className="empty-state">
                <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                  <rect x="10" y="14" width="48" height="40" rx="7" stroke="#d1d5db" strokeWidth="2.5" fill="#f9fafb" />
                  <path d="M22 30h24M22 39h14" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <p>
                  Chọn <strong style={{ color: "#6366f1" }}>Theo sách</strong> hoặc{" "}
                  <strong style={{ color: "#6366f1" }}>Theo thể loại</strong>
                  <br />để hiển thị danh sách tại đây
                </p>
              </div>
            )}

            {form.applyType === "BOOK" && (
              <div>
                <h4>Danh sách sách <span className="sp-badge">{selBooks.size}</span></h4>
                <input
                  className="search-box"
                  type="text"
                  placeholder="🔍 Tìm kiếm sách..."
                  value={bookSearch}
                  onChange={e => setBookSearch(e.target.value)}
                />
                <div className="select-bar">
                  <span className="count">{selBooks.size} đã chọn</span>
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={() => {
                      if (allBooksSelected) {
                        setSelBooks(new Set());
                      } else {
                        setSelBooks(new Set(filteredBooks.map(b => b.id)));
                      }
                      setAllBooksSelected(!allBooksSelected);
                    }}
                  >
                    {allBooksSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                </div>
                <div className="item-grid">
                  {filteredBooks.map(b => (
                    <div
                      key={b.id}
                      className={`item-card ${selBooks.has(b.id) ? "selected" : ""}`}
                      onClick={() => {
                        setSelBooks(toggle(selBooks, b.id));
                        setErrors(v => ({ ...v, applyType: undefined }));
                      }}
                    >
                      <input type="checkbox" readOnly checked={selBooks.has(b.id)} />
                      <span className="item-label">{b.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.applyType === "CATEGORY" && (
              <div>
                <h4>Danh sách thể loại <span className="sp-badge">{selCats.size}</span></h4>
                <input
                  className="search-box"
                  type="text"
                  placeholder="🔍 Tìm kiếm thể loại..."
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                />
                <div className="select-bar">
                  <span className="count">{selCats.size} đã chọn</span>
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={() => {
                      if (allCatsSelected) {
                        setSelCats(new Set());
                      } else {
                        setSelCats(new Set(filteredCats.map(c => c.id)));
                      }
                      setAllCatsSelected(!allCatsSelected);
                    }}
                  >
                    {allCatsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                </div>
                <div className="item-grid">
                  {filteredCats.map(c => (
                    <div
                      key={c.id}
                      className={`item-card ${selCats.has(c.id) ? "selected" : ""}`}
                      onClick={() => {
                        setSelCats(toggle(selCats, c.id));
                        setErrors(v => ({ ...v, applyType: undefined }));
                      }}
                    >
                      <input type="checkbox" readOnly checked={selCats.has(c.id)} />
                      <span className="item-label">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}