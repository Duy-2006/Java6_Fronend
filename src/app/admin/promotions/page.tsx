"use client";

import { getAllPromotions, PromotionDTO } from "@/services/promotionServices";
import { useEffect, useState } from "react";
import Link from "next/link";
import DeletePromoButton from "@/app/admin/promotions/_components/DeletePromoButton";

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

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionDTO[]>([]);
  const [fetchError, setFetchError] = useState<string>("");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token")      ||
        "";

      if (!token) {
        setFetchError("Chưa đăng nhập. Vui lòng đăng nhập lại.");
        return;
      }

      let data = await getAllPromotions(token);
      
      // Sort: ACTIVE -> UPCOMING -> EXPIRED, then by startDate descending
      const statusOrder: Record<string, number> = { ACTIVE: 1, UPCOMING: 2, EXPIRED: 3, UNKNOWN: 4 };
      data.sort((a, b) => {
        const statusA = a.computedStatus || "UNKNOWN";
        const statusB = b.computedStatus || "UNKNOWN";
        if (statusOrder[statusA] !== statusOrder[statusB]) {
          return statusOrder[statusA] - statusOrder[statusB];
        }
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });
      
      setPromotions(data);
    } catch (error: any) {
      setFetchError(error.message || "Không thể tải danh sách khuyến mãi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .promo-container { max-width: 1100px; margin: auto; }
        .promo-card { background:#fff; border-radius:14px; box-shadow:0 20px 40px rgba(0,0,0,0.08); padding:24px; }
        .promo-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .promo-header h3 { font-size:20px; font-weight:600; color:#111827; margin:0; }
        .btn-create { background:linear-gradient(135deg,#6366f1,#22c55e); color:#fff; padding:10px 16px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:500; }
        .promo-table { width:100%; border-collapse:collapse; font-size:14px; }
        .promo-table thead { background:#f9fafb; }
        .promo-table th, .promo-table td { padding:14px 12px; border-bottom:1px solid #e5e7eb; }
        .promo-table th { font-weight:600; color:#374151; }
        .promo-table tbody tr:hover { background:#f3f4f6; }
        .pbadge { padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; }
        .badge-active   { background:#dcfce7; color:#166534; }
        .badge-upcoming { background:#dbeafe; color:#1e40af; }
        .badge-expired  { background:#fee2e2; color:#991b1b; }
        .badge-all  { background:#f3f4f6; color:#374151; }
        .badge-book { background:#fef9c3; color:#854d0e; }
        .badge-cat  { background:#ede9fe; color:#5b21b6; }
        .promo-actions a { margin-right:6px; font-size:13px; padding:6px 10px; border-radius:8px; border:1px solid #d1d5db; color:#374151; text-decoration:none; }
        .promo-actions a:hover { background:#111827; color:#fff; }
        .promo-empty { text-align:center; padding:40px; color:#6b7280; font-size:15px; }
        .error-msg { background:#fee2e2; color:#991b1b; padding:12px 16px; border-radius:10px; margin-bottom:16px; font-size:14px; }
        .loading-msg { text-align:center; padding:40px; color:#6b7280; font-size:15px; }
      `}</style>

      <div className="promo-container">
        <div className="promo-card">
          <div className="promo-header">
            <h3>Danh sách chương trình khuyến mãi</h3>
            <Link href="/admin/promotions/new" className="btn-create">+ Tạo mới</Link>
          </div>

          {fetchError && <div className="error-msg">⚠️ {fetchError}</div>}

          {loading ? (
            <div className="loading-msg">Đang tải dữ liệu...</div>
          ) : (
            <table className="promo-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Giá trị giảm</th>
                  <th>Loại áp dụng</th>
                  <th>Lượt dùng</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="promo-empty">
                      Chưa có chương trình khuyến mãi nào
                    </td>
                  </tr>
                ) : (
                  promotions.map((p) => {
                    const apply  = APPLY_BADGE[p.applyType]              ?? { label: "—", cls: "" };
                    const status = STATUS_BADGE[p.computedStatus ?? "UNKNOWN"] ?? { label: "—", cls: "" };
                    return (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.discountValue}%</td>
                        <td><span className={`pbadge ${apply.cls}`}>{apply.label}</span></td>
                        <td>
                          {p.usageLimit ? `${p.usedCount || 0} / ${p.usageLimit}` : "Không giới hạn"}
                        </td>
                        <td>{p.startDate}</td>
                        <td>{p.endDate}</td>
                        <td><span className={`pbadge ${status.cls}`}>{status.label}</span></td>
                        <td className="promo-actions">
                          <Link href={`/admin/promotions/${p.id}`}>Chi tiết</Link>
                          <Link href={`/admin/promotions/${p.id}/edit`}>Sửa</Link>
                          {/* ✅ Truyền getData làm onDeleted — xóa xong tự cập nhật list ngay */}
                          <DeletePromoButton
                            promoId={p.id!}
                            onDeleted={getData}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}