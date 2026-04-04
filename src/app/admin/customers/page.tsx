import Link from "next/link";
import ToggleStatusButton from "@/app/admin/customers/_components/ToggleStatusButton";
import SearchCustomers from "@/app/admin/customers/_components/SearchCustomers";

interface SearchParams { success?: string; q?: string }

export const metadata = { title: "Quản lý Khách Hàng" };

async function getCustomers(): Promise<any[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Lỗi tải danh sách khách hàng.");
  return res.json();
}

function CustomerTypeBadge({ type }: { type: string }) {
  if (type === "VIP (Thân thiết)")
    return (
      <span className="badge rounded-pill bg-warning text-dark border border-warning shadow-sm">
        <i className="fa-solid fa-crown me-1" /> VIP
      </span>
    );
  if (type === "Tiềm năng")
    return (
      <span className="badge rounded-pill bg-info bg-opacity-10 text-info border border-info">
        <i className="fa-solid fa-star me-1" /> Tiềm năng
      </span>
    );
  return (
    <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary">
      <i className="fa-solid fa-user me-1" /> Mới
    </span>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let customers: any[] = [];
  let fetchError = "";

  try {
    customers = await getCustomers();
  } catch {
    fetchError = "Không thể tải danh sách khách hàng.";
  }

  // Lọc theo từ khóa tìm kiếm (client-side fallback)
  const q = searchParams?.q?.toLowerCase() ?? "";
  const filtered = q
    ? customers.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
      )
    : customers;

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {searchParams?.success && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-3" role="alert">
          <i className="fa-solid fa-circle-check me-2" />
          {searchParams.success}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
        </div>
      )}

      {fetchError && (
        <div className="alert alert-danger shadow-sm mb-3">{fetchError}</div>
      )}

      <div className="card border-0 shadow-sm">
        {/* Header */}
        <div
          className="card-header text-white py-3 d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-users-gear fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Danh sách Khách Hàng</h5>
          </div>
          <SearchCustomers />
        </div>

        {/* Table */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
              <thead>
                <tr
                  className="text-center text-uppercase small fw-bold text-secondary"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
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
                      {/* Thông tin */}
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold me-3"
                            style={{ width: 40, height: 40, fontSize: "1.2rem" }}
                          >
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

                      {/* Username */}
                      <td className="text-center">
                        <span className="badge bg-light text-secondary border font-monospace">
                          {u.username}
                        </span>
                      </td>

                      {/* Chi tiêu */}
                      <td className="text-end fw-bold text-success">
                        {new Intl.NumberFormat("vi-VN").format(u.totalSpending)} đ
                      </td>

                      {/* Phân loại */}
                      <td className="text-center">
                        <CustomerTypeBadge type={u.customerType} />
                      </td>

                      {/* Trạng thái */}
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

                      {/* Hành động */}
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/admin/customers/${u.username}/history`}
                            className="btn btn-outline-primary"
                            title="Xem lịch sử mua hàng"
                          >
                            <i className="fa-solid fa-clock-rotate-left" />
                          </Link>
                          <ToggleStatusButton
                            username={u.username}
                            isActive={u.active}
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