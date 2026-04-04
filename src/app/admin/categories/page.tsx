import Link from "next/link";
import { getAllCategories } from "@/services/categoriesService";
import DeleteCategoryButton from "@/app/admin/categories/_components/DeleteCategoryButton";

interface SearchParams {
  success?: string;
  error?: string;
}

export const metadata = { title: "Quản lý Thể Loại" };

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let categories: any[] = [];
  let fetchError = "";

  try {
    categories = await getAllCategories();
  } catch {
    fetchError = "Không thể tải danh sách thể loại. Vui lòng thử lại sau.";
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
        {/* Header */}
        <div
          className="card-header text-white py-3 d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))" }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-layer-group fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Danh sách Thể Loại</h5>
          </div>
          <Link href="/admin/categories/new" className="btn btn-light text-primary fw-bold btn-sm shadow-sm">
            <i className="fa-solid fa-plus me-1" /> Thêm mới
          </Link>
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
                  <th style={{ width: 80 }}>ID</th>
                  <th className="text-start">Tên Thể Loại</th>
                  <th style={{ width: 200 }}>Thống kê</th>
                  <th style={{ width: 150 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-folder-open fa-3x mb-3 opacity-25 d-block" />
                      <p className="m-0 fw-bold">Chưa có dữ liệu thể loại.</p>
                      <small>Hãy bấm "Thêm mới" để bắt đầu.</small>
                    </td>
                  </tr>
                ) : (
                  categories.map((item) => (
                    <tr key={item.id}>
                      {/* ID */}
                      <td className="text-center fw-bold text-muted">{item.id}</td>

                      {/* Tên */}
                      <td className="fw-bold" style={{ color: "var(--primary-blue)" }}>
                        {item.name}
                      </td>

                      {/* Thống kê */}
                      <td className="text-center">
                        <span className="badge rounded-pill bg-light text-dark border border-secondary-subtle px-3 py-2">
                          <i className="fa-solid fa-book me-1 text-info" />
                          {item.books?.length ?? 0} đầu sách
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/admin/categories/${item.id}/edit`}
                            className="btn btn-outline-primary"
                            title="Chỉnh sửa"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </Link>
                          <DeleteCategoryButton categoryId={item.id} />
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