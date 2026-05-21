"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  reviewDate: string;
}

interface Props {
  bookId: number;
}

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const getUser = () => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export default function ReviewsSection({ bookId }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/books/${bookId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.error("Error fetching reviews:", e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getUser());
    fetchReviews();
  }, [bookId]);

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setErrorMessage("Vui lòng đăng nhập để gửi đánh giá.");
      router.push("/auth/login");
      return;
    }

    if (!comment.trim()) {
      setErrorMessage("Vui lòng nhập bình luận đánh giá.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_URL}/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Cảm ơn bạn đã gửi đánh giá!");
        setComment("");
        setRating(5);
        fetchReviews(); // Refresh review list
      } else {
        setErrorMessage(data.message || "Không thể gửi đánh giá.");
      }
    } catch (error) {
      setErrorMessage("Không kết nối được server.");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-8 py-8 border-t border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">Đánh Giá & Nhận Xét</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Ý kiến phản hồi từ các khách hàng</p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[#C92127]">{averageRating}</span>
            <div className="flex flex-col">
              <div className="flex text-[#ffc700] text-xs gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < Math.round(Number(averageRating)) ? "★" : "☆"}</span>
                ))}
              </div>
              <span className="text-xs text-gray-500">({reviews.length} đánh giá)</span>
            </div>
          </div>
        )}
      </div>

      {/* Review Submission Form */}
      <div className="bg-white rounded-[32px] border border-[rgba(10,19,23,0.08)] p-6 md:p-8">
        <h3 className="text-base font-bold text-[#0a1317] mb-4">Viết Nhận Xét Của Bạn</h3>
        
        {currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-full">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 text-green-600 text-xs font-semibold px-4 py-2.5 rounded-full">
                {successMessage}
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#0a1317]">Đánh giá:</span>
              <div className="flex text-2xl text-[#ffc700] gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    {i < rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập nội dung đánh giá chi tiết của bạn tại đây..."
                className="w-full min-h-[100px] border border-gray-200 rounded-[16px] p-4 text-sm outline-none focus:border-[#C92127] transition"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#C92127] hover:bg-[#A8171C] text-white text-xs font-bold py-2.5 px-6 rounded-full transition shadow-sm disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "Gửi Đánh Giá"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-[#f4f6f8] rounded-[24px] border border-dashed border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Bạn cần đăng nhập để viết nhận xét.</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="bg-[#0a1317] hover:bg-[#202528] text-white text-xs font-bold py-2 px-6 rounded-full transition"
            >
              Đăng Nhập Ngay
            </button>
          </div>
        )}
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-[#C92127] border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs text-gray-400">Đang tải đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Chưa có đánh giá nào cho cuốn sách này. Hãy là người đầu tiên nhận xét!</p>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-[#f4f6f8] rounded-[24px] p-5 border border-[rgba(10,19,23,0.04)] space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#C92127]/10 flex items-center justify-center text-[#C92127] font-bold text-xs">
                      {r.userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0a1317]">{r.userName || "Khách ẩn danh"}</h4>
                      <div className="flex text-[#ffc700] text-[10px] gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < r.rating ? "★" : "☆"}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {r.reviewDate ? new Date(r.reviewDate).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : ""}
                  </span>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line pl-10">
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
