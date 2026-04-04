import Link from "next/link";
import { getAllAuthors } from "@/services/authorsService";
import DeleteAuthorButton from "@/app/admin/authors/_components/DeleteAuthorButton";

interface SearchParams {
  success?: string;
  error?: string;
}

export const metadata = { title: "Quản lý Tác Giả" };

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let authors: any[] = [];
  let fetchError = "";

  try {
    authors = await getAllAuthors();
  } catch {
    fetchError = "Không thể tải danh sách tác giả. Vui lòng thử lại sau.";
  }

  const success = searchParams?.success;
  const error = searchParams?.error || fetchError;

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2" />
          {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <i className="fa-solid fa-circle-check me-2" />
          {success}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div
          className="card-header text-white py-3 d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-user-pen fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Danh sách Tác Giả</h5>
          </div>
          <Link href="/admin/authors/new" className="btn btn-light text-primary fw-bold btn-sm shadow-sm">
            <i className="fa-solid fa-plus me-1" /> Thêm mới
          </Link>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
              <thead>
                <tr
                  className="text-center text-uppercase small fw-bold text-secondary"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <th style={{ width: 80 }}>ID</th>
                  <th className="text-start">Tên Tác Giả</th>
                  <th className="text-start">Email Liên Hệ</th>
                  <th style={{ width: 180 }}>Thống kê</th>
                  <th style={{ width: 150 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {authors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-feather fa-3x mb-3 opacity-25 d-block" />
                      <p className="m-0 fw-bold">Chưa có dữ liệu tác giả.</p>
                      <small>Hãy thêm tác giả mới để bắt đầu quản lý sách.</small>
                    </td>
                  </tr>
                ) : (
                  authors.map((item) => (
                    <tr key={item.id}>
                      <td className="text-center fw-bold text-muted">{item.id}</td>

                      <td className="fw-bold" style={{ color: "var(--primary-blue)" }}>
                        <i className="fa-regular fa-id-card me-2 text-muted opacity-50" />
                        {item.name}
                      </td>

                      <td className="text-start text-muted">
                        {item.email ? (
                          <>
                            <i className="fa-regular fa-envelope me-1 small" />
                            {item.email}
                          </>
                        ) : (
                          <span className="text-muted small fst-italic">(Chưa cập nhật)</span>
                        )}
                      </td>

                      <td className="text-center">
                        <span className="badge rounded-pill bg-white text-primary border border-primary-subtle px-3 py-2 shadow-sm">
                          <i className="fa-solid fa-book-open me-1" />
                          {item.books?.length ?? 0} tác phẩm
                        </span>
                      </td>

                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/admin/authors/${item.id}/edit`}
                            className="btn btn-outline-primary"
                            title="Chỉnh sửa"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </Link>
                          <DeleteAuthorButton authorId={item.id} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}