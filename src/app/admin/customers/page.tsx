// app/admin/customers/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ToggleStatusButton from "@/app/admin/customers/_components/ToggleStatusButton";
import SearchCustomers from "@/app/admin/customers/_components/SearchCustomers";
import { getAllCustomers, CustomerSummary } from "@/services/customersService";

function CustomerTypeBadge({ type }: { type: string }) {
  const isVip = type?.toUpperCase() === "VIP";
  return (
    <span className={`badge ${isVip ? "bg-warning text-dark" : "bg-secondary text-white"} px-3 py-2 rounded-pill`}>
      {type || "MEMBER"}
    </span>
  );
}

import { Suspense } from "react";

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const success = searchParams.get("success");

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Hiển thị thông báo từ URL (nếu có)
  useEffect(() => {
    if (success) {
      setToast({ msg: success, type: 'success' });
      // Xóa param khỏi URL
      window.history.replaceState(null, '', '/admin/customers');
    }
  }, [success, router]);

  // Tự động ẩn toast sau 1 giây
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(data);
      setFetchError("");
    } catch (err: any) {
      setFetchError(err.message || "Không thể tải danh sách khách hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const refreshCustomers = () => {
    loadCustomers();
  };

  const filtered = q
    ? customers.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
      )
    : customers;

  if (loading) {
    return <div className="text-center p-5">Đang tải danh sách khách hàng...</div>;
  }

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {toast && (
        <div className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show shadow-sm mb-3`}>
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} me-2`} />
          {toast.msg}
          <button type="button" className="btn-close" onClick={() => setToast(null)} />
        </div>
      )}

      {fetchError && (
        <div className="alert alert-danger shadow-sm mb-3">{fetchError}</div>
      )}

      <div className="card border-0 shadow-sm">
        <div
          className="card-header text-white py-3 d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, #0d6efd, #0a58ca)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-users-gear fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Danh sách Khách Hàng</h5>
          </div>
          <SearchCustomers />
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
              <thead>
                <tr className="text-center text-uppercase small fw-bold text-secondary" style={{ backgroundColor: "#f8f9fa" }}>
                  <th className="text-start ps-4">Thông tin Khách hàng</th>
                  <th>Username</th>
                  <th className="text-end">Tổng chi tiêu</th>
                  <th>Phân loại</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 120 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-users-slash fa-3x mb-3 opacity-25 d-block" />
                      <p className="m-0 fw-bold">Không tìm thấy khách hàng.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.username}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold me-3" style={{ width: 40, height: 40, fontSize: "1.2rem" }}>
                            {u.fullName?.charAt(0) ?? "U"}
                          </div>
                          <div>
                            <strong className="d-block text-dark">{u.fullName}</strong>
                            <small className="text-muted">
                              <i className="fa-regular fa-envelope me-1" />{u.email}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-secondary border font-monospace">{u.username}</span>
                      </td>
                      <td className="text-end fw-bold text-success">
                        {new Intl.NumberFormat("vi-VN").format(u.totalSpending)} đ
                      </td>
                      <td className="text-center">
                        <CustomerTypeBadge type={u.customerType} />
                      </td>
                      <td className="text-center">
                        {u.active ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                            <i className="fa-solid fa-check-circle me-1" /> Hoạt động
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill">
                            <i className="fa-solid fa-ban me-1" /> Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Link href={`/admin/customers/${u.username}/history`} className="btn btn-outline-primary" title="Xem lịch sử mua hàng">lịch sử 
                            <i className="fa-solid fa-clock-rotate-left" />
                          </Link>
                          <ToggleStatusButton 
                            username={u.username} 
                            isActive={u.active} 
                            onToggleSuccess={refreshCustomers} 
                            onShowToast={(msg, type) => setToast({ msg, type })}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="card-footer bg-white border-0 py-3">
            <div className="small text-muted text-center">
              Đang quản lý <strong>{filtered.length}</strong> tài khoản khách hàng.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="text-center py-5">Đang tải...</div>}>
      <CustomersContent />
    </Suspense>
  );
}