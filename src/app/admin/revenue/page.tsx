export const metadata = { title: "Dashboard Doanh thu" };

interface TopBook {
  bookId: number;
  title:  string;
  sold:   number;
}

interface DashboardData {
  totalRevenue:    number;
  todayRevenue:    number;
  todayOrders:     number;
  deliveredOrders: number;
  topBooks:        TopBook[];
}

async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/revenue/dashboard`,
    { cache: "no-store" }
  );
  if (!res.ok) return { totalRevenue: 0, todayRevenue: 0, todayOrders: 0, deliveredOrders: 0, topBooks: [] };
  return res.json();
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}

export default async function RevenueDashboardPage() {
  let data: DashboardData = { totalRevenue: 0, todayRevenue: 0, todayOrders: 0, deliveredOrders: 0, topBooks: [] };
  try { data = await getDashboard(); } catch {}

  const statCards = [
    { label: "Tổng doanh thu",   value: formatVND(data.totalRevenue),    color: "green" },
    { label: "Doanh thu hôm nay",value: formatVND(data.todayRevenue),    color: "blue"  },
    { label: "Đơn hôm nay",      value: String(data.todayOrders),        color: ""      },
    { label: "Đơn đã giao",      value: String(data.deliveredOrders),    color: "green" },
  ];

  return (
    <>
      <style>{`
        .card-box { background:#fff; border-radius:16px; padding:22px; box-shadow:0 15px 30px rgba(0,0,0,0.06); }
        .card-title { font-size:14px; color:#6b7280; }
        .card-value { font-size:26px; font-weight:700; margin-top:6px; }
        .green { color:#16a34a; }
        .red   { color:#dc2626; }
        .blue  { color:#2563eb; }
      `}</style>

      <div className="container-fluid">
        <h3 className="mb-4 fw-bold">Dashboard doanh thu</h3>

        {/* Stat cards */}
        <div className="row g-4 mb-4">
          {statCards.map((card) => (
            <div key={card.label} className="col-md-3">
              <div className="card-box">
                <div className="card-title">{card.label}</div>
                <div className={`card-value ${card.color}`}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top sách */}
        <div className="card-box">
          <h5 className="mb-3 fw-semibold">Top sách bán chạy</h5>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>ID sách</th>
                <th>Tên sách</th>
                <th>Đã bán</th>
              </tr>
            </thead>
            <tbody>
              {data.topBooks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                data.topBooks.map((b) => (
                  <tr key={b.bookId}>
                    <td>{b.bookId}</td>
                    <td>{b.title}</td>
                    <td className="fw-bold text-success">{b.sold}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}