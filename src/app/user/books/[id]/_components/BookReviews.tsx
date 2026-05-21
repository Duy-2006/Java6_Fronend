'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Review {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  reviewDate: string;
}

interface BookReviewsProps {
  bookId: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Hàm lấy token giống như trong AddToCartSection
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export default function BookReviews({ bookId }: BookReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Lấy token khi component mount (giống AddToCartSection)
  useEffect(() => {
    setToken(getToken());
  }, []);

  // Fetch reviews (không cần token)
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/api/books/${bookId}/reviews`);
        if (!res.ok) throw new Error('Không thể tải đánh giá');
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Có lỗi xảy ra khi tải đánh giá.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [bookId]);

  // Gửi đánh giá mới (cần token)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Vui lòng đăng nhập để đánh giá sách.');
      return;
    }
    if (!newComment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/books/${bookId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      if (!res.ok) throw new Error('Gửi đánh giá thất bại');
      const newReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
      setNewComment('');
      setNewRating(5);
    } catch (err) {
      alert('Không thể gửi đánh giá. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Tính rating trung bình
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalf
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) return <div className="text-center py-4">Đang tải đánh giá...</div>;
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Đánh giá từ khách hàng</h3>
          <div className="flex items-center gap-2 mt-1">
            {renderStars(avgRating)}
            <span className="text-sm font-medium">{avgRating.toFixed(1)} / 5</span>
            <span className="text-sm text-muted-foreground">({reviews.length} đánh giá)</span>
          </div>
        </div>
      </div>

      {/* Form gửi đánh giá - hiển thị nếu có token */}
      {token ? (
        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Đánh giá của bạn</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="focus:outline-none"
                >
                  <svg
                    className={`h-6 w-6 ${
                      star <= newRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-muted text-muted-foreground'
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nhận xét</label>
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </form>
      ) : (
        <div className="bg-muted/50 p-4 rounded-lg text-center text-muted-foreground">
          <p>🔐 Đăng nhập để viết đánh giá cho cuốn sách này.</p>
        </div>
      )}

      {/* Danh sách đánh giá */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét!
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.userName}</span>
                  {renderStars(review.rating)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.reviewDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="mt-2 text-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}