"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * BodyCleanup Component
 * Chạy ngầm 100% (trả về null, không hiển thị bất kỳ giao diện hay HTML nào).
 * Nhiệm vụ: Tự động dọn dẹp các thuộc tính bị kẹt trên thẻ <body> (như overflow: hidden, pointer-events)
 * khi người dùng chuyển route hoặc đóng modal quá nhanh, giúp giao diện luôn mượt mà và không bao giờ bị đơ cuộn.
 */
export default function BodyCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Khôi phục thuộc tính cuộn và tương tác của document.body
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
      document.body.style.paddingRight = "";
      document.body.classList.remove("modal-open");

      // Xóa các backdrop của bootstrap modal bị kẹt (nếu có)
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((el) => el.remove());
    }
  }, [pathname]);

  return null;
}
