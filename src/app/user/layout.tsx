// src/app/user/layout.tsx
import React from "react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1c1c1e] antialiased selection:bg-red-500/20 selection:text-[#C92127]">
      {children}
    </div>
  );
}