/*
 * layout.tsx (User Layout)
 * Layout chinh cho phan giao dien nguoi dung (storefront/khach hang).
 * Thiet lap nen sang, font chu dam, va hieu ung boi chon van ban mau do (theo thuong hieu).
 */

import React from "react";

// Component layout User: boc toan bo cac trang phia nguoi dung
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1c1c1e] antialiased selection:bg-red-500/20 selection:text-[#C92127]">
      {children}
    </div>
  );
}