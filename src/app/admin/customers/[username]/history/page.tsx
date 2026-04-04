import Link from "next/link";
import { notFound } from "next/navigation";

interface HistoryPageProps {
  params: { username: string };
}

async function getCustomerHistory(username: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers/history/${username}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Chờ xác nhận", cls: "bg-warning text-dark border-warning"  },
  CONFIRMED: { label: "Đã xác nhận",  cls: "bg-info text-dark border-info"         },
  SHIPPING:  { label: "Đang giao",    cls: "bg-primary border-primary"             },
  COMPLETED: { label: "Hoàn thành",   cls: "bg-success border-success"             },
  CANCELLED: { label: "Đã hủy",       cls: "bg-danger border-danger"               },
};

export async function generateMetadata({ params }: HistoryPageProps) {
  return { title: `Lịch sử mua hàng — ${params.username}` };
}

export default async function CustomerHistoryPage({ params }: HistoryPageProps) {
  const customer = await getCustomerHistory(params.username);
  if (!customer) notFound();

  const orders: any[] = customer.orders ?? [];
  const totalSpending = new Intl.NumberFormat("vi-VN").format(customer.totalSpending ?? 0);
  const initial = customer.fullName?.charAt(0) ?? "U";

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {/* Back */}
      <div className="mb-4">
        <Link href="/admin/customers" className="btn btn-light border fw-bold text-secondary">
          <i className="fa-solid fa-arrow-left me-2" /> Quay lại danh sách
        </Link>
      </div>

      <div className="row g-4">
        {/* Customer card */}
        <div className="col-md-4 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-4">
              <div
                className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center fw-bold mb-3 shadow-sm"
                style={{ width: 100, height: 100, fontSize: "2.5rem" }}
              >
                {initial}
              </div>
              <h5 className="card-title fw-bold text-dark mb-1">{customer.fullName}</h5>
              <p className="text-muted mb-4 small">
                <i className="fa-regular fa-envelope me-1" /> {customer.email}
              </p>
              <div className="border-top pt-4">
                <small
                  className="text-uppercase text-secondary fw-bold"
                  style={{ fontSize: "0.75rem", letterSpacing: 1 }}
                >
                  Tổng chi tiêu tích lũy
                </small>
                <h2 className="text-success fw-bold mt-2">
                  {totalSpending} <span className="fs-6">đ</span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="col-md-8 col-xl-9">
          <div className="card border-0 shadow-sm h-100">
            <div
              className="card-header text-white py-3 d-flex justify-content-between align-items-center"
              style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}
            >
              <div className="d-flex align-items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left fs-5" />
                <h5 className="m-0 fw-bold text-uppercase">Lịch sử đơn hàng</h5>
              </div>
              <span className="badge bg-white text-primary fw-bold px-3 py-2 rounded-pill shadow-sm">
                {orders.length} đơn hàng
              </span>
            </div>

            <div className="card-body p-0">
              {orders.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-solid fa-cart-arrow-down fa-3x mb-3 opacity-25 d-block" />
                  <p className="m-0">Khách hàng này chưa có đơn hàng nào.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr
                        className="small fw-bold text-uppercase text-secondary"
                        style={{ backgroundColor: "#f8f9fa" }}
                      >
                        <th className="ps-4">Mã đơn</th>
                        <th>Ngày đặt</th>
                        <th className="text-end">Tổng tiền</th>
                        <th className="text-center">Trạng thái</th>
                        <th className="text-end pe-4">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const status = STATUS_MAP[o.status] ?? { label: o.status, cls: "bg-secondary" };
                        const orderCode = o.orderCode ?? `ORD${o.id}`;
                        const orderDate = o.orderDate
                          ? new Date(o.orderDate).toLocaleString("vi-VN", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—";
                        const amount = new Intl.NumberFormat("vi-VN").format(o.totalAmount ?? 0);

                        return (
                          <tr key={o.id}>
                            <td className="ps-4">
                              <span className="badge bg-light text-secondary border font-monospace">
                                {orderCode}
                              </span>
                            </td>
                            <td className="text-muted small">
                              <i className="fa-regular fa-clock me-1" />
                              {orderDate}
                            </td>
                            <td className="text-end fw-bold text-danger">{amount} đ</td>
                            <td className="text-center">
                              <span className={`badge rounded-pill border ${status.cls}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="text-end pe-4">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className="btn btn-outline-primary btn-sm rounded-circle shadow-sm"
                                title="Xem chi tiết"
                                style={{ width: 32, height: 32, padding: 0, lineHeight: "30px" }}
                              >
                                <i className="fa-solid fa-chevron-right" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}