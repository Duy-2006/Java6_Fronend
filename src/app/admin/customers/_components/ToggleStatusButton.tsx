"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  username: string;
  isActive: boolean;
}

export default function ToggleStatusButton({ username, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const confirmed = window.confirm(
      "Xác nhận thay đổi trạng thái hoạt động của tài khoản này?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers/toggle/${username}`,
        { method: "PUT" }
      );
      if (res.ok) {
        router.refresh();
      } else {
        alert("Không thể thay đổi trạng thái tài khoản.");
      }
    } catch {
      alert("Lỗi kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`btn btn-sm ${isActive ? "btn-outline-danger" : "btn-outline-success"}`}
      title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      ) : (
        <i className={`fa-solid ${isActive ? "fa-lock" : "fa-lock-open"}`} />
      )}
    </button>
  );
}