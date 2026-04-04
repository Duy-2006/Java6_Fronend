"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchCustomers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/admin/customers?${params.toString()}`);
  };

  return (
    <div className="input-group input-group-sm" style={{ width: 260 }}>
      <input
        type="text"
        className="form-control border-0 bg-white bg-opacity-25"
        style={{ color: "white" }}
        placeholder="Tìm khách hàng..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <button
        className="btn btn-outline-light border-0 bg-white bg-opacity-25"
        type="button"
        onClick={handleSearch}
      >
        <i className="fa-solid fa-magnifying-glass" />
      </button>
    </div>
  );
}