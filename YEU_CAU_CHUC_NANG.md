# 2.3. YÊU CẦU CHỨC NĂNG HỆ THỐNG

Hệ thống được thiết kế để phân tách các vai trò (roles) người dùng rõ ràng bao gồm: Khách hàng (Customer), Quản trị viên (Admin), và Nhân viên giao hàng (Delivery Staff). Dưới đây là đặc tả chi tiết toàn bộ các nhóm chức năng của hệ thống:

---

## A. NHÓM CHỨC NĂNG DÀNH CHO KHÁCH HÀNG (CUSTOMER)

### 2.3.1. Quản lý tài khoản cá nhân
* **Đăng ký tài khoản:** Khách hàng điền thông tin (Họ tên, Email, Số điện thoại, Mật khẩu) để tạo tài khoản mới.
* **Đăng nhập hệ thống:** Xác thực thông tin đăng nhập, hệ thống cấp mã thông báo JWT (JSON Web Token) để truy cập các dịch vụ bảo mật.
* **Đăng xuất:** Xóa token khỏi bộ nhớ client để kết thúc phiên làm việc.
* **Quên mật khẩu / Khôi phục mật khẩu:** Nhận mã OTP hoặc link xác thực qua Email để đặt lại mật khẩu mới.
* **Quản lý hồ sơ cá nhân:** Cập nhật các thông tin cá nhân (Ảnh đại diện, Họ tên, Số điện thoại, Địa chỉ giao hàng mặc định).
* **Xem thông tin tích lũy:** Xem tổng chi tiêu tích lũy và hạng thành viên hiện tại (Bronze, Silver, Gold, Diamond...) để hưởng chiết khấu.

### 2.3.2. Tìm kiếm và Khám phá sản phẩm
* **Tìm kiếm sách thông thường:** Tìm kiếm bằng từ khóa văn bản theo tên sách, tác giả, nhà xuất bản hoặc danh mục.
* **Tìm kiếm sách bằng hình ảnh (Visual Search):** Cho phép người dùng tải lên hoặc chụp ảnh bìa sách từ thiết bị. Hệ thống sử dụng mô hình AI OpenCLIP (`ViT-B-32`) để trích xuất đặc trưng và truy vấn tìm kiếm tương đồng vector trên thư viện **FAISS**, trả về sách khớp nhất trong thời gian dưới 1 giây.
* **Bộ lọc và Sắp xếp:** Lọc sách theo thể loại, khoảng giá bán, mức độ đánh giá (số sao) hoặc định dạng sản phẩm (Sách giấy, Sách nói); Sắp xếp theo giá tăng/giảm, lượt mua, hoặc mức giảm giá.
* **Xem chi tiết sách:** Hiển thị thông tin sách giấy (mô tả, số trang, tồn kho, giá bán, tác giả, nhà xuất bản), thông tin sách nói (giá mua, danh sách chương, thời lượng nghe) cùng phần đánh giá nhận xét từ khách hàng khác.
* **Nghe thử Audiobook:** Cho phép khách hàng nghe thử một vài chương mở đầu miễn phí của định dạng sách nói trước khi quyết định mua.

### 2.3.3. Giỏ hàng và Thanh toán (Checkout Flow)
* **Quản lý giỏ hàng:** Thêm sản phẩm (Sách giấy hoặc Sách nói) vào giỏ hàng, cập nhật số lượng sách giấy, xóa sản phẩm khỏi giỏ hàng, tự động tính tổng tiền.
* **Áp dụng ưu đãi tự động:** Hệ thống tự động nhận diện hạng thành viên để chiết khấu giảm giá trực tiếp (Member Rank Discount).
* **Áp dụng Voucher khuyến mãi:** Nhập mã giảm giá thủ công (Voucher), hệ thống kiểm tra tính hợp lệ và giới hạn lượt áp dụng của tài khoản để giảm tiền đơn hàng.
* **Đặt hàng & Thanh toán trực tuyến (PayOS):**
  * Đối với đơn sách giấy: Điền địa chỉ nhận hàng, chọn phương thức thanh toán (COD hoặc chuyển khoản ngân hàng qua cổng PayOS).
  * Đối với đơn sách nói: Bỏ qua địa chỉ giao hàng (chỉ cần giao hàng số), thanh toán qua PayOS.
  * Tích hợp cổng **PayOS**: Hệ thống tạo mã QR thanh toán ngân hàng tự động. Khi thanh toán thành công, PayOS gửi callback xác nhận trạng thái đơn hàng đã thanh toán (`PAID`), hệ thống tự động kích hoạt quyền sở hữu Audiobook trong thư viện số của khách hàng ngay lập tức.

### 2.3.4. Quản lý Đơn hàng cá nhân
* **Lịch sử đơn hàng:** Theo dõi danh sách các đơn hàng đã đặt và trạng thái tương ứng (Chờ xác nhận, Đã xác nhận, Đang giao, Giao thành công, Hoàn thành, Đã hủy).
* **Chi tiết đơn hàng:** Xem lại thông tin chi tiết từng đơn hàng bao gồm: Mã đơn, Danh sách sản phẩm mua, Giá từng loại, Tiền giảm giá, Phí ship, Tổng thanh toán và Trạng thái thanh toán.
* **Hủy đơn hàng:** Cho phép khách hàng tự hủy đơn hàng (kèm lý do hủy) khi đơn hàng đang ở trạng thái `PENDING` (Chờ xác nhận).

### 2.3.5. Trải nghiệm Audiobook (Sách nói)
* **Thư viện sách nói của tôi (My Audiobooks):** Lưu trữ toàn bộ danh sách các sách nói người dùng đã mua hoặc được tặng.
* **Trình phát nhạc Audiobook chuyên nghiệp:**
  * Hỗ trợ phát âm thanh trực tuyến trên trình duyệt Web/Mobile.
  * Tự động chuyển tiếp chương tiếp theo liền mạch khi kết thúc chương hiện tại (Autoplay/Gapless playback).
  * Lưu trữ tiến trình nghe (Listening Progress): Hệ thống tự động ghi nhớ vị trí (số giây) đang nghe của chương sách nói và tự động phát tiếp đúng vị trí đó ở lần nghe sau trên mọi thiết bị.
  * DRM Bảo vệ bản quyền: Dữ liệu âm thanh được truyền phát dưới dạng phân đoạn byte chunks ẩn link gốc (Proxy Stream) để tránh bị tải lậu.

### 2.3.6. Trợ lý ảo AI Chatbot (RAG Assistant)
* **Hỗ trợ trò chuyện tự nhiên:** Giao diện bong bóng chat tại góc màn hình phản hồi 24/7.
* **Tư vấn gợi ý sách:** Tìm kiếm và trả lời các thông tin liên quan đến nội dung sách theo ngữ nghĩa nhờ kiến trúc RAG kết hợp Vector Database **Qdrant**.
* **Giải đáp thông tin & chính sách:** Giải đáp các thắc mắc về chính sách vận chuyển, đổi trả hàng, thông tin liên hệ cửa hàng qua tài liệu tĩnh FAQ được nạp sẵn.
* **Tra cứu dữ liệu thời gian thực (Tool Calling):**
  * Tra cứu giá bán thật và số lượng tồn kho hiện tại của một cuốn sách (`getBookRealtimeInfo`).
  * Tìm kiếm sách theo từ khóa (`searchBooks`).
  * Tra cứu trạng thái giao nhận và thanh toán của một đơn hàng cụ thể (`getOrderStatus`).
  * Xem danh sách 5 đơn hàng gần nhất của bản thân (`getMyRecentOrders`).
  * Hỏi về các khuyến mãi, mã voucher giảm giá đang có hiệu lực trên cửa hàng (`getActivePromotions`, `getActiveVouchers`).
  * Kiểm tra thông tin hạng thành viên và tổng tiền tích lũy cá nhân (`getUserProfileInfo`).
  * Truy cập nhanh thư viện sách nói đã sở hữu (`getMyAudiobookLibrary`).

---

## B. NHÓM CHỨC NĂNG DÀNH CHO QUẢN TRỊ VIÊN (ADMIN/STAFF)

### 2.3.7. Quản lý sản phẩm và nội dung (CMS)
* **Quản lý Sách (Books):** Thêm mới sách, sửa thông tin, ẩn sách (soft delete), khôi phục sách đã ẩn.
* **Quản lý Chương sách (Chapters):** CRUD các chương sách, hỗ trợ upload file văn bản (`.txt`) để tự động phân tích và nạp nội dung text của chương.
* **Quản lý Tác giả (Authors):** Thêm, sửa, xóa thông tin tác giả (nền tảng hỗ trợ một cuốn sách có nhiều tác giả - Many-to-Many).
* **Quản lý Nhà xuất bản (Publishers):** CRUD thông tin đối tác xuất bản sách.
* **Quản lý Danh mục (Categories):** CRUD các thể loại sách để phân loại hiển thị.
* **Quản lý Banner:** Quản trị hình ảnh slide quảng cáo và sự kiện trên trang chủ.

### 2.3.8. Quản lý sản xuất Sách nói (AI Text-to-Speech)
* **Tạo âm thanh tự động (TTS Generation):** Nhấn nút tạo audio trên giao diện Admin, hệ thống tự động gửi yêu cầu bất đồng bộ (Reactive WebClient) sang dịch vụ AI Python.
* **Theo dõi tiến trình TTS:** Giám sát trạng thái xử lý audio (`Pending`, `Processing`, `Success`, `Failed`) và hỗ trợ bấm tạo lại khi gặp lỗi.
* **Lưu trữ CDN tự động:** File âm thanh sau khi chuyển đổi bằng Microsoft edge-tts được tự động ghép nối và đẩy lên Cloudinary CDN để lưu trữ tối ưu băng thông.

### 2.3.9. Đồng bộ Vector chỉ mục tự động (AI indexing sync)
* **Đồng bộ tự động:** Khi Admin Thêm mới, Cập nhật, Khóa/Mở khóa sách, hệ thống tự động chạy ngầm (`CompletableFuture`) gửi tín hiệu cập nhật chỉ mục vector sang cơ sở dữ liệu Vector **FAISS** (tìm kiếm bìa ảnh) và **Qdrant** (chatbot tư vấn RAG).
* **Đánh lại chỉ mục thủ công (Rebuild Index):** Hỗ trợ Admin nhấn nút re-index toàn bộ dữ liệu ảnh bìa sách và mô tả sách để phục vụ công tác cập nhật lại mô hình AI.

### 2.3.10. Quản lý đơn hàng toàn hệ thống
* **Theo dõi & Lọc đơn hàng:** Danh sách đơn hàng toàn hệ thống được phân chia thành Đơn sách giấy và Đơn sách nói; Hỗ trợ tìm kiếm theo mã đơn, SĐT hoặc lọc theo trạng thái.
* **Phê duyệt đơn hàng:** Xác nhận đơn hàng, thay đổi trạng thái đơn từ Chờ xác nhận -> Đã xác nhận -> Đang giao -> Giao thành công -> Hoàn thành.
* **Phân công vận chuyển:** Phân phối đơn hàng cho nhân viên giao hàng (Delivery Staff) phụ trách.
* **Xuất báo cáo Excel:** Xuất toàn bộ hoặc bộ lọc danh sách đơn hàng ra tệp tin Excel (`.xlsx`) phục vụ thống kê kế toán.
* **Quản lý hoàn tiền thủ công:** Nhận cảnh báo và thông tin số điện thoại khách hàng cần liên hệ để hoàn tiền thủ công đối với các giao dịch online (PayOS) bị hủy đơn.

### 2.3.11. Quản lý Khuyến mãi & Voucher
* **Thiết lập Khuyến mãi (Promotions):** Giảm giá trực tiếp theo phần trăm hoặc số tiền trên từng đầu sách giấy/sách nói, cấu hình các chương trình Flash Sale theo khung giờ nhất định.
* **Giảm giá theo hạng thành viên (Rank Discount):** Cấu hình tỷ lệ chiết khấu ưu đãi tự động cho từng cấp bậc thành viên (Vàng, Bạc, Đồng...).
* **Quản lý Voucher:** CRUD các mã giảm giá, thiết lập số lượng phát hành, thời gian áp dụng, mức giảm và các giới hạn an toàn ngăn chặn người dùng sử dụng lặp lại bất hợp pháp.

### 2.3.12. Quản lý người dùng và Phân quyền
* **Quản lý tài khoản người dùng:** Xem danh sách khách hàng và nhân viên trong hệ thống.
* **Khóa/Mở khóa tài khoản:** Vô hiệu hóa quyền truy cập của các tài khoản vi phạm chính sách bán hàng.
* **Phân quyền vai trò:** Thiết lập vai trò sử dụng hệ thống cho tài khoản (`ADMIN`, `STAFF`, `DELIVERY`, `CUSTOMER`).

### 2.3.13. Báo cáo thống kê (Dashboard)
* **Thống kê doanh số:** Hiển thị doanh thu hoàn thành, số lượng đơn hàng đang xử lý, tổng đơn hàng toàn hệ thống.
* **Biểu đồ trực quan:** Biểu đồ tăng trưởng doanh thu theo ngày/tháng/năm.
* **Phân tích sản phẩm:** Danh sách sách bán chạy, phân tích tỉ lệ doanh thu giữa Sách giấy và Sách nói số.

---

## C. NHÓM CHỨC NĂNG DÀNH CHO NHÂN VIÊN GIAO HÀNG (DELIVERY STAFF)

### 2.3.14. Giao nhận đơn hàng
* **Xem đơn hàng được phân công:** Đăng nhập hệ thống và truy cập danh sách các đơn hàng vật lý đã được Admin phân phối giao hàng.
* **Cập nhật trạng thái giao hàng:** Thay đổi trạng thái đơn hàng sang `SHIPPING` (Bắt đầu giao) và xác nhận `DELIVERED` (Giao thành công) sau khi đã giao hàng và thu tiền của khách (nếu là COD).
