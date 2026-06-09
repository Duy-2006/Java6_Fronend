// app/admin/customers/_components/SearchCustomers.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchCustomers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  // Đồng bộ state khi URL thay đổi (do back/forward hoặc reset)
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/admin/customers?${params.toString()}`);
  };

  const handleReset = () => {
    setQ("");
    router.push("/admin/customers");
  };

  return (
    <div className="input-group input-group-sm w-[260px]">
      <input
        type="text"
        className="form-control border-0 bg-white bg-opacity-25 text-white"
        placeholder="Tìm khách hàng..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      {q && (
        <button
          className="btn btn-outline-light border-0 bg-white bg-opacity-25"
          type="button"
          onClick={handleReset}
          title="Xóa tìm kiếm"
          aria-label="Xóa tìm kiếm"
        >
          <i className="fa-solid fa-times" />
        </button>
      )}
      <button
        className="btn btn-outline-light border-0 bg-white bg-opacity-25"
        type="button"
        onClick={handleSearch}
        aria-label="Tìm kiếm"
      >
        <i className="fa-solid fa-magnifying-glass" />
      </button>
    </div>
  );
}