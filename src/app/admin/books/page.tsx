import Link from "next/link";
import { getAllBooks } from "@/services/booksService";
import DeleteBookButton from "@/app/admin/books/_components/DeleteBookButton";

interface SearchParams {
  success?: string;
}

export const metadata = { title: "Quản lý Kho Sách" };

export default async function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let books: any[] = [];
  let fetchError = "";

  try {
    books = await getAllBooks();
  } catch {
    fetchError = "Không thể tải danh sách sách. Vui lòng thử lại sau.";
  }

  const success = searchParams?.success;

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">

      {success && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-3" role="alert">
          <i className="fa-solid fa-circle-check me-2" />
          {success}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
        </div>
      )}

      {fetchError && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-3" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2" />
          {fetchError}
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
            <i className="fa-solid fa-book-journal-whills fs-5" />
            <h5 className="m-0 fw-bold text-uppercase">Kho Sách</h5>
          </div>
          <Link href="/admin/books/new" className="btn btn-light text-primary fw-bold btn-sm shadow-sm">
            <i className="fa-solid fa-plus me-1" /> Nhập sách mới
          </Link>
        </div>

        <div className="card-body p-0">
          {books.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-box-open fa-3x mb-3 opacity-25 d-block" />
              <p className="m-0 fw-bold">Kho sách đang trống.</p>
              <small>Hãy nhập thêm đầu sách mới để bắt đầu kinh doanh.</small>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle mb-0">
                  <thead>
                    <tr
                      className="text-center text-uppercase small fw-bold text-secondary"
                      style={{ backgroundColor: "#f8f9fa" }}
                    >
                      <th style={{ width: 80 }}>Hình ảnh</th>
                      <th className="text-start">Thông tin sách</th>
                      <th style={{ width: 120 }}>Giá bán</th>
                      <th style={{ width: 100 }}>Tồn kho</th>
                      <th style={{ width: 150 }}>Thể loại</th>
                      <th style={{ width: 120 }}>Trạng thái</th>
                      <th style={{ width: 120 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <BookRow key={book.id} book={book} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-footer bg-white border-0 py-3">
                <div className="small text-muted text-center">
                  Hiển thị toàn bộ <strong>{books.length}</strong> đầu sách trong kho.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Row Component ---------- */
function BookRow({ book }: { book: any }) {
  const imageUrl = book.imageUrl
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${book.imageUrl}`
    : "https://placehold.co/50x75?text=No+Img";

  const priceFormatted = new Intl.NumberFormat("vi-VN").format(book.price);

  return (
    <tr>
      {/* Hình ảnh */}
      <td className="text-center">
        <img
          src={imageUrl}
          alt={book.title}
          className="rounded shadow-sm border"
          style={{ width: 50, height: 75, objectFit: "cover" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/50x75?text=No+Img";
          }}
        />
      </td>

      {/* Thông tin sách */}
      <td>
        <div className="d-flex flex-column">
          <span className="badge bg-light text-muted border mb-1 w-auto align-self-start">
            {book.isbn || "N/A"}
          </span>
          <strong className="text-primary mb-1" style={{ fontSize: "1rem" }}>
            {book.title}
          </strong>
          <small className="text-muted">
            <i className="fa-solid fa-pen-nib me-1" />
            {book.author?.name}
          </small>
        </div>
      </td>

      {/* Giá bán */}
      <td className="text-end fw-bold text-danger">
        {priceFormatted}{" "}
        <span className="small text-muted text-decoration-underline">đ</span>
      </td>

      {/* Tồn kho */}
      <td className="text-center">
        {book.quantity > 10 ? (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2">
            {book.quantity}
          </span>
        ) : book.quantity > 0 ? (
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2">
            <i className="fa-solid fa-triangle-exclamation me-1" />
            {book.quantity}
          </span>
        ) : (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2">
            Hết hàng
          </span>
        )}
      </td>

      {/* Thể loại */}
      <td className="text-center text-muted small">
        <i className="fa-solid fa-layer-group me-1 opacity-50" />
        {book.category?.name}
      </td>

      {/* Trạng thái */}
      <td className="text-center">
        {book.active ? (
          <span className="badge rounded-pill text-bg-success bg-gradient shadow-sm" style={{ fontWeight: 500 }}>
            <i className="fa-solid fa-check me-1" /> Đang bán
          </span>
        ) : (
          <span className="badge rounded-pill text-bg-secondary bg-gradient shadow-sm" style={{ fontWeight: 500 }}>
            <i className="fa-solid fa-pause me-1" /> Ngừng bán
          </span>
        )}
      </td>

      {/* Thao tác */}
      <td className="text-center">
        <div className="btn-group btn-group-sm">
          <Link
            href={`/admin/books/${book.id}/edit`}
            className="btn btn-outline-primary"
            title="Chỉnh sửa"
          >
            <i className="fa-solid fa-pen-to-square" />
          </Link>
          <DeleteBookButton bookId={book.id} />
        </div>
      </td>
    </tr>
  );
}