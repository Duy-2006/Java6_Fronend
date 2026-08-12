# 📚 Tài Liệu Kỹ Thuật: Tính Năng Tìm Kiếm Sách Bằng Hình Ảnh (Visual Book Search)

## 📌 Tổng Quan Kiến Trúc
Hệ thống kết hợp 3 tầng chính để xử lý tìm kiếm sách bằng hình ảnh dựa trên độ tương đồng vector (Vector Similarity Search):
1. **Python AI Microservice (`TTS-Python-Service`)**: Sử dụng OpenCLIP (`ViT-B-32`) trích xuất vector đặc trưng và FAISS lưu trữ / truy vấn vector.
2. **Backend Java Spring Boot**: Đóng vai trò API Gateway & Proxy, nhận file ảnh, tương tác với Python Service, chuyển đổi danh sách ID sang `BookDTO` từ SQL Server và tự động đồng bộ FAISS index khi Admin CRUD sách.
3. **Frontend Next.js**: Cung cấp giao diện người dùng (Modal trên Navbar và Banner trên trang `/user/search`) với hiệu ứng scanner animation và hiển thị sản phẩm bằng `BookCard`.

---

## 1. 🤖 Dịch Vụ AI Python (`TTS-Python-Service`)

### 1.1 `embedding_service.py`
- **Chức năng**: Trích xuất vector đặc trưng 512 chiều từ ảnh bìa sách bằng mô hình **OpenCLIP (`ViT-B-32`)**.
- **Mô hình**: `ViT-B-32` (pretrained `laion2b_s34b_b79k`).
- **Tối ưu**: Khởi tạo dạng Singleton, hỗ trợ đọc ảnh từ byte stream, file cục bộ hoặc HTTP URL. Chuẩn hóa vector L2 để tìm kiếm Cosine/Inner Product chuẩn xác.

### 1.2 `faiss_service.py`
- **Chức năng**: Quản lý cơ sở dữ liệu Vector với **FAISS (`IndexFlatIP` kết hợp `IndexIDMap2`)**, hỗ trợ các thao tác CRUD vector (thêm, cập nhật, xóa, re-index toàn bộ) để đồng bộ với SQL Server.
- **Cấu trúc Index**: Lưu trữ trên đĩa (`book_index.faiss` & `metadata.json`), liên kết chính xác `book_id` (kiểu Integer từ SQL Server) với vector tương ứng.
- **Tính năng CRUD Vector**:
  - `build_index`: Đánh lại chỉ mục cho toàn bộ sách.
  - `add_or_update_book`: Thêm mới hoặc cập nhật vector của 1 sách (tự động xóa vector cũ nếu đã tồn tại).
  - `remove_book`: Xóa vector của 1 sách theo `book_id`.
  - `search_similar`: Truy vấn Top-K sách tương đồng nhất.

### 1.3 `main.py`
Expose các RESTful API:
- `POST /api/image-search`: Nhận ảnh từ Frontend/Java Backend, trích xuất vector và tìm $K$ sách có độ tương đồng cao nhất.
- `POST /api/index/build`: Đánh lại chỉ mục FAISS cho danh sách sách truyền vào.
- `POST /api/index/update`: Thêm/Cập nhật 1 sách vào FAISS index.
- `DELETE /api/index/delete/{book_id}`: Xóa sách khỏi chỉ mục FAISS.

---

## 2. ☕ Backend Java Spring Boot

### 2.1 `ImageSearchService.java`
- Đóng vai trò **Proxy** giao tiếp với Python Service thông qua `WebClient`.
- Nhận file ảnh từ client, chuyển sang Python Service để lấy danh sách `book_id` và `similarity`.
- Truy vấn database và chuyển đổi thành danh sách `BookDTO` đầy đủ thông tin (giá, giảm giá, số lượng bán, tác giả, giá audio, trạng thái hoạt động).

### 2.2 `ImageSearchApiController.java`
Expose REST APIs cho Client và Admin:
- **Client API**: `POST /api/books/search-by-image` (nhận `MultipartFile image`).
- **Admin API**: `POST /api/admin/books/reindex-images` (Re-index toàn bộ sách).

### 2.3 Đồng Bộ Tự Động Trong `AdminBooksApiController.java`
- Khi Admin **Thêm mới**, **Cập nhật**, **Ẩn (Soft Delete)** hoặc **Khôi phục** sách, hệ thống tự động chạy bất đồng bộ (`CompletableFuture`) để gọi `updateBookIndex` hoặc `deleteBookIndex` tới Python Service.

---

## 3. 🌐 Frontend Next.js

### 3.1 Modal Tìm Kiếm Bằng Ảnh Tại `Navbar.tsx`
- Nút Upload ảnh bìa sách với hiệu ứng scanner animation chuyên nghiệp.
- Gọi API `/api/books/search-by-image` gửi dữ liệu multipart sang Backend Java.
- Hiển thị danh sách kết quả trực tiếp bằng component **`BookCard`** (đầy đủ ảnh bìa, tên sách, giá, nút thêm vào giỏ hàng...).

### 3.2 Trang Tìm Kiếm `d:\Java6\src\app\user\search\page.tsx`
- Bổ sung banner Upload ảnh trực tiếp trên trang `/user/search`.
- Hiển thị preview ảnh đã tải lên và danh sách sách khớp nhất dạng lưới (Grid `BookCard`).
