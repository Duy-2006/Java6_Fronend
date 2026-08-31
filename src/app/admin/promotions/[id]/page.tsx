"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPromotionById, updatePromotion, PromotionDTO } from "@/services/promotionServices";
import { ChevronRight, Edit, Calendar, Globe, BookOpen, Layers, Tag, Percent, Info, ShieldAlert, PauseCircle, PlayCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const APPLY_BADGE: Record<string, { label: string; bg: string; textCol: string; icon: any }> = {
  ALL:      { label: "Toàn sàn",      bg: "bg-rose-50 border-rose-100", textCol: "text-[#b70011]", icon: Globe },
  BOOK:     { label: "Theo sách",      bg: "bg-indigo-50 border-indigo-100", textCol: "text-indigo-700", icon: BookOpen },
  CATEGORY: { label: "Theo thể loại", bg: "bg-purple-50 border-purple-100", textCol: "text-purple-700", icon: Layers },
};

const STATUS_BADGE: Record<string, { label: string; bg: string; textCol: string; dot: string }> = {
  UPCOMING: { label: "Sắp diễn ra",   bg: "bg-blue-50 border-blue-200", textCol: "text-blue-700", dot: "bg-blue-700" },
  ACTIVE:   { label: "Đang diễn ra",  bg: "bg-emerald-50 border-emerald-200", textCol: "text-emerald-700", dot: "bg-emerald-700" },
  EXPIRED:  { label: "Đã kết thúc",   bg: "bg-slate-50 border-slate-200", textCol: "text-slate-600", dot: "bg-slate-600" },
  UNKNOWN:  { label: "Chưa đặt ngày", bg: "bg-amber-50 border-amber-200", textCol: "text-amber-700", dot: "bg-amber-700" },
  PAUSED:   { label: "Tạm dừng",      bg: "bg-orange-50 border-orange-200", textCol: "text-orange-700", dot: "bg-orange-700" },
};

export default function PromotionDetailsPage() {
  const params = useParams();
  const id = Number(params.id);

  const [promo, setPromo] = useState<PromotionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    const fetchPromo = async () => {
      try {
        const data = await getPromotionById(id);
        setPromo(data);
      } catch (err: any) {
        setError(err.message || "Không thể tải chi tiết khuyến mãi.");
      } finally {
        setLoading(false);
      }
    };
    fetchPromo();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!promo) return;
    try {
      setToggling(true);
      const { id: _, computedStatus, bookTitles, categoryNames, ...payload } = promo;
      const updatedPayload = { ...payload, status: !promo.status };
      await updatePromotion(promo.id!, updatedPayload);
      
      // Re-fetch to get updated details
      const data = await getPromotionById(promo.id!);
      setPromo(data);
      
      toast({
        title: "Thành công",
        description: `Đã ${data.status ? 'kích hoạt' : 'tạm dừng'} chương trình khuyến mãi.`,
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể thay đổi trạng thái",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải chi tiết khuyến mãi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 shadow-sm text-sm font-sans max-w-7xl mx-auto mt-4">
        {error}
      </div>
    );
  }

  if (!promo) return null;

  const apply = APPLY_BADGE[promo.applyType] ?? { label: "—", bg: "", textCol: "", icon: Info };
  const status = STATUS_BADGE[promo.computedStatus ?? "UNKNOWN"] ?? { label: "—", bg: "", textCol: "", dot: "" };
  const ApplyIcon = apply.icon;

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 animate__animated animate__fadeIn font-sans space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1e] font-sans">Chi tiết Khuyến mãi</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/promotions"
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#191c1e] border border-[#e6bdb8] rounded-lg font-semibold text-xs shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
          >
            Quay lại
          </Link>
          <button
            onClick={handleToggleStatus}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs shadow-sm transition-all cursor-pointer ${
              promo.status 
                ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {promo.status ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            {toggling ? "Đang xử lý..." : promo.status ? "Tạm dừng" : "Tiếp tục"}
          </button>
          <Link
            href={`/admin/promotions/${promo.id}/edit`}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#b70011] text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-[#b70011]/90 transition-all cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#e6bdb8]/10">
              <div className="p-2 bg-[#ffdad6] text-[#b70011] rounded-lg">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#191c1e]">Thông tin chung</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider">Tên chương trình</span>
                <p className="text-base font-bold text-[#191c1e]">{promo.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider">Mức giảm giá</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#b70011]">{promo.discountValue}</span>
                  <Percent className="w-5 h-5 text-[#b70011]" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider">Loại áp dụng</span>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap ${apply.bg} ${apply.textCol} mt-1 w-fit`}>
                  <ApplyIcon className="w-3.5 h-3.5" />
                  {apply.label}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider">Trạng thái</span>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${status.bg} ${status.textCol} mt-1 w-fit`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                  {status.label}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider">Thời gian diễn ra</span>
                <div className="flex items-center gap-2 mt-1 text-[#191c1e] font-medium text-sm">
                  <Calendar className="w-4 h-4 text-[#916f6b]" />
                  <span>{promo.startDate ? new Date(promo.startDate).toLocaleDateString('vi-VN') : '—'}</span>
                  <span className="text-[#916f6b]">đến</span>
                  <span>{promo.endDate ? new Date(promo.endDate).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#5c403c] uppercase tracking-wider">Giới hạn lượt dùng</span>
                <div className="mt-1 flex items-center gap-2 text-[#191c1e] font-medium">
                  <ShieldAlert className="w-4 h-4 text-[#916f6b]" />
                  {promo.usageLimit ? (
                    <span className={`${(promo.usedCount || 0) >= promo.usageLimit ? 'text-red-600 font-bold' : ''}`}>
                      {promo.usedCount || 0} / {promo.usageLimit}
                    </span>
                  ) : (
                    <span>Không giới hạn</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Applied Items List */}
          {(promo.applyType === "BOOK" || promo.applyType === "CATEGORY") && (
            <div className="bg-white p-6 rounded-xl border border-[#e6bdb8]/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#e6bdb8]/10">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${apply.bg} ${apply.textCol}`}>
                    <ApplyIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#191c1e]">
                    Danh sách {promo.applyType === "BOOK" ? "Sách" : "Thể loại"} áp dụng
                  </h3>
                </div>
                <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {promo.applyType === "BOOK" ? promo.bookTitles?.length || 0 : promo.categoryNames?.length || 0} mục
                </span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {promo.applyType === "BOOK" && promo.bookTitles && promo.bookTitles.length > 0 ? (
                  <ul className="space-y-2">
                    {promo.bookTitles.map((t, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium text-[#191c1e]">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : promo.applyType === "CATEGORY" && promo.categoryNames && promo.categoryNames.length > 0 ? (
                  <ul className="space-y-2">
                    {promo.categoryNames.map((c, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium text-[#191c1e]">
                        <Layers className="w-4 h-4 text-slate-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-[#916f6b] text-sm">Chưa có mục nào được chọn.</div>
                )}
              </div>
            </div>
          )}

          {promo.applyType === "ALL" && (
            <div className="bg-gradient-to-r from-rose-50 to-[#ffdad6]/20 p-8 rounded-xl border border-rose-100 text-center">
              <Globe className="w-12 h-12 text-[#b70011] mx-auto mb-4 opacity-80" />
              <h4 className="text-lg font-bold text-[#191c1e] mb-2">Áp dụng Toàn Sàn</h4>
              <p className="text-[#5c403c] text-sm max-w-md mx-auto leading-relaxed">
                Khuyến mãi này tự động áp dụng mức giảm <span className="font-bold text-[#b70011]">{promo.discountValue}%</span> cho <span className="font-bold">toàn bộ sản phẩm sách</span> trên hệ thống cửa hàng.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Mini Preview Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-gradient-to-br from-[#b70011] to-[#8a000d] p-6 rounded-2xl shadow-md text-white relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="promoCirclesDetail" width="30" height="30" patternUnits="userSpaceOnUse">
                      <circle cx="15" cy="15" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#promoCirclesDetail)" />
                </svg>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold border border-white/30 backdrop-blur-sm shadow-sm">
                    GIẢM {promo.discountValue}%
                  </div>
                  <Tag className="w-5 h-5 opacity-80" />
                </div>

                <div>
                  <h4 className="text-xl font-bold leading-tight line-clamp-2 text-white">
                    {promo.name}
                  </h4>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium opacity-90 bg-black/20 p-2 rounded-lg w-fit backdrop-blur-sm border border-black/10">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{promo.startDate ? new Date(promo.startDate).toLocaleDateString('vi-VN') : '—'}</span>
                    <span>-</span>
                    <span>{promo.endDate ? new Date(promo.endDate).toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4 flex flex-col gap-2 mt-4 text-xs font-medium">
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Phạm vi</span>
                    <span className="font-bold">{apply.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80">Lượt dùng</span>
                    <span className="font-bold">
                      {promo.usageLimit ? `${promo.usedCount || 0}/${promo.usageLimit}` : 'Không giới hạn'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
               <p className="text-[11px] text-[#916f6b]">ID Khuyến mãi: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{promo.id}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
