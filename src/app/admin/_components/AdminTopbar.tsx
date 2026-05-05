"use client";

import { useState, useEffect } from "react";

export default function AdminTopbar() {
  const [adminName, setAdminName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      window.location.replace("/");
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    })
      .then(async res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => {
        if (data.role !== "ADMIN") {
          localStorage.removeItem("token");
          window.location.replace("/");
        } else {
          setAdminName(data.name);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.location.replace("/");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    // Xóa token
    localStorage.removeItem("token");
     localStorage.removeItem("user");
    
    // Xóa sessionStorage nếu có
    sessionStorage.clear();
    
    // Chuyển hướng về trang chủ và force reload
    window.location.href = "/";
    
    // Reload lại sau 50ms để đảm bảo
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  if (isLoading) {
    return (
      <nav className="navbar px-4 py-2 bg-white shadow-sm">
        <div className="d-flex justify-content-between align-items-center w-100">
          <h5 className="m-0 text-secondary fw-bold">Hệ thống quản trị</h5>
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar px-4 py-2 bg-white shadow-sm">
      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-light d-md-none">
              <i className="fa-solid fa-bars" />
            </button>
            <h5 className="m-0 text-secondary fw-bold">
              <i className="fa-solid fa-crown me-2 text-warning"></i>
              Hệ thống quản trị
            </h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName || "Admin")}&background=005c97&color=fff`}
              className="rounded-circle"
              width={32}
              height={32}
              alt="Avatar"
            />
            <span className="fw-semibold text-dark">{adminName || "Admin"}</span>
            <span className="badge bg-danger">ADMIN</span>
            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            >
              <i className="fa-solid fa-sign-out-alt"></i>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}