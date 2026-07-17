"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPromotionById, PromotionDTO } from "@/services/promotionServices";

const APPLY_BADGE: Record<string, { label: string; cls: string }> = {
  ALL:      { label: "🌐 Toàn sàn",      cls: "badge-all"  },
  BOOK:     { label: "📚 Theo sách",      cls: "badge-book" },
  CATEGORY: { label: "🏷️ Theo thể loại", cls: "badge-cat"  },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  UPCOMING: { label: "🕐 Sắp diễn ra",   cls: "badge-upcoming" },
  ACTIVE:   { label: "✅ Đang chạy",      cls: "badge-active"   },
  EXPIRED:  { label: "❌ Đã kết thúc",    cls: "badge-expired"  },
  UNKNOWN:  { label: "⚠️ Chưa đặt ngày", cls: ""               },
};

export default function PromotionDetailsPage() {
  const params = useParams();
  const id = Number(params.id);

  const [promo, setPromo] = useState<PromotionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchPromo = async () => {
      try {
        const token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("token") ||
          "";
        const data = await getPromotionById(id, token);
        setPromo(data);
      } catch (err: any) {
        setError(err.message || "Không thể tải chi tiết khuyến mãi.");
      } finally {
        setLoading(false);
      }
    };
    fetchPromo();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!promo) return <div className="p-10 text-center text-gray-500">Không tìm thấy khuyến mãi.</div>;

  const apply = APPLY_BADGE[promo.applyType] ?? { label: "—", cls: "" };
  const status = STATUS_BADGE[promo.computedStatus ?? "UNKNOWN"] ?? { label: "—", cls: "" };

  return (
    <>
      <style>{`
        .promo-detail-container { max-width: 800px; margin: auto; padding: 20px; }
        .promo-detail-card { background: #fff; border-radius: 14px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .pd-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
        .pd-header h2 { font-size: 22px; font-weight: 700; color: #111827; margin: 0; }
        .pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .pd-item { display: flex; flex-direction: column; gap: 4px; }
        .pd-label { font-size: 13px; font-weight: 600; color: #6b7280; }
        .pd-value { font-size: 15px; font-weight: 500; color: #111827; }
        .pd-badge { padding: 4px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; display: inline-block; }
        
        .badge-active   { background:#dcfce7; color:#166534; }
        .badge-upcoming { background:#dbeafe; color:#1e40af; }
        .badge-expired  { background:#fee2e2; color:#991b1b; }
        .badge-all  { background:#f3f4f6; color:#374151; }
        .badge-book { background:#fef9c3; color:#854d0e; }
        .badge-cat  { background:#ede9fe; color:#5b21b6; }

        .pd-list { background: #f9fafb; border-radius: 10px; padding: 16px; margin-top: 20px; }
        .pd-list h4 { margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #374151; }
        .pd-list ul { list-style: disc; padding-left: 20px; margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; }
        .pd-back { display: inline-block; margin-top: 24px; color: #6366f1; font-weight: 600; text-decoration: none; }
        .pd-back:hover { text-decoration: underline; }
      `}</style>
      <div className="promo-detail-container">
        <div className="promo-detail-card">
          <div className="pd-header">
            <h2>Chi tiết Khuyến mãi: {promo.name}</h2>
            <Link href={`/admin/promotions/${promo.id}/edit`} className="pd-badge" style={{ background: '#f3f4f6', color: '#374151', textDecoration: 'none', border: '1px solid #d1d5db' }}>
              Chỉnh sửa
            </Link>
          </div>

          <div className="pd-grid">
            <div className="pd-item">
              <span className="pd-label">Giá trị giảm</span>
              <span className="pd-value text-red-600 font-bold">{promo.discountValue}%</span>
            </div>
            <div className="pd-item">
              <span className="pd-label">Loại áp dụng</span>
              <div><span className={`pd-badge ${apply.cls}`}>{apply.label}</span></div>
            </div>
            <div className="pd-item">
              <span className="pd-label">Ngày bắt đầu</span>
              <span className="pd-value">{promo.startDate || '—'}</span>
            </div>
            <div className="pd-item">
              <span className="pd-label">Ngày kết thúc</span>
              <span className="pd-value">{promo.endDate || '—'}</span>
            </div>
            <div className="pd-item">
              <span className="pd-label">Trạng thái</span>
              <div><span className={`pd-badge ${status.cls}`}>{status.label}</span></div>
            </div>
            <div className="pd-item">
              <span className="pd-label">Lượt dùng</span>
              <span className="pd-value">
                {promo.usageLimit ? `${promo.usedCount || 0} / ${promo.usageLimit}` : 'Không giới hạn'}
              </span>
            </div>
          </div>

          {promo.applyType === "BOOK" && promo.bookTitles && promo.bookTitles.length > 0 && (
            <div className="pd-list">
              <h4>Danh sách Sách áp dụng ({promo.bookTitles.length}):</h4>
              <ul>
                {promo.bookTitles.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {promo.applyType === "CATEGORY" && promo.categoryNames && promo.categoryNames.length > 0 && (
            <div className="pd-list">
              <h4>Danh sách Thể loại áp dụng ({promo.categoryNames.length}):</h4>
              <ul>
                {promo.categoryNames.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {promo.applyType === "ALL" && (
            <div className="pd-list">
              <h4>Đối tượng áp dụng:</h4>
              <p style={{ margin: 0, fontSize: 14, color: '#4b5563' }}>Khuyến mãi này áp dụng cho toàn bộ sản phẩm trên hệ thống.</p>
            </div>
          )}

          <Link href="/admin/promotions" className="pd-back">← Quay lại danh sách</Link>
        </div>
      </div>
    </>
  );
}
