"use client";

import React, { useState } from "react";
import { toggleCustomerStatus } from "@/services/customersService";
import { Lock, Unlock, Loader2 } from "lucide-react";

interface Props {
  username: string;
  isActive: boolean;
  onToggleSuccess: () => void;        // gọi để refresh danh sách
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ToggleStatusButton({ username, isActive, onToggleSuccess, onShowToast }: Props) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!username) {
      onShowToast("Username không hợp lệ.", "error");
      return;
    }

    const confirmed = window.confirm(
      isActive
        ? `Xác nhận KHÓA tài khoản của khách hàng "${username}"?`
        : `Xác nhận MỞ KHÓA tài khoản của khách hàng "${username}"?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await toggleCustomerStatus(username);
      onShowToast(result.message || (isActive ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản thành công."), "success");
      onToggleSuccess(); // refresh danh sách
    } catch (error: any) {
      onShowToast(error.message || "Không thể thay đổi trạng thái tài khoản.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`px-3 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold transition-all duration-200 ${isActive
        ? "bg-red-50 text-[#b70011] hover:bg-red-100 border-[#e6bdb8]/50 active:scale-95"
        : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200 active:scale-95"
        } disabled:opacity-50`}
      onClick={handleToggle}
      disabled={loading}
      title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isActive ? (
        <Lock className="w-3.5 h-3.5" />
      ) : (
        <Unlock className="w-3.5 h-3.5" />
      )}
      <span>
        {isActive ? "Khóa" : "Mở khóa"}
      </span>
    </button>
  );
}