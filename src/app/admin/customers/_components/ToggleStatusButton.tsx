"use client";

import { useState } from "react";
import { toggleCustomerStatus } from "@/services/customersService";

interface Props {
  username: string;
  isActive: boolean;
  onToggleSuccess: () => void;        // gọi để refresh danh sách
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ToggleStatusButton({ username, isActive, onToggleSuccess, onShowToast }: Props) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!username) {
      onShowToast("Username không hợp lệ.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Xác nhận thay đổi trạng thái hoạt động của tài khoản này?"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await toggleCustomerStatus(username);
      onShowToast(result.message, "success");
      onToggleSuccess(); // refresh danh sách
    } catch (error: any) {
      onShowToast(error.message || "Không thể thay đổi trạng thái tài khoản.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
  <button
    className={`btn btn-sm d-flex align-items-center gap-1 ${
      isActive ? "btn-outline-danger" : "btn-outline-success"
    }`}
    onClick={handleToggle}
    disabled={loading}
  >
    {loading ? (
      <span className="spinner-border spinner-border-sm" role="status" />
    ) : (
      <>
        <i className={`fa-solid ${isActive ? "fa-lock" : "fa-lock-open"}`} />
        <span>
          {isActive ? "Khóa " : "Mở khóa "}
        </span>
      </>
    )}
  </button>
);
}