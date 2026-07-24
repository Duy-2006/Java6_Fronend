# BookStoreOnline - Dự án Bán Sách Online

Dự án website bán sách online xây dựng trên nền tảng **Spring Boot**, **Thymeleaf**, **SQL Server** và dịch vụ xử lý âm thanh/TTS hỗ trợ.

---

## 🛠 Công Nghệ Sử Dụng

- **Backend**: Spring Boot 3.2.5, Spring MVC, Spring Data JPA, Lombok
- **Frontend**: Thymeleaf, HTML5, CSS3, JavaScript
- **Database**: SQL Server
- **Khác**: Docker, Maven, Python TTS Service

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Yêu Cầu Tiền Đề

- **Java JDK**: 17 trở lên
- **Maven**: 3.8+ (hoặc dùng `mvnw` đi kèm)
- **SQL Server**: Đã cài đặt và đang chạy trên cổng `1433`
- **Database Name**: `BookStoree`

### 2. Cấu Hình Cơ Sở Dữ Liệu

Chỉnh sửa thông tin kết nối CSDL trong file `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=BookStoree;encrypt=true;trustServerCertificate=true;
spring.datasource.username=sa
spring.datasource.password=123
```

### 3. Chạy Ứng Dụng

Dùng lệnh Maven Wrapper:

```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

Sau khi ứng dụng khởi chạy thành công, truy cập trình duyệt tại:
👉 `http://localhost:8080/`

---

## 🐳 Chạy Bằng Docker (Tùy chọn)

```bash
docker-compose up --build -d
```

---

## 📝 Đóng Góp & Bảo Trì

Dự án thuộc chương trình môn học / đồ án tốt nghiệp. Vui lòng không công khai các thông tin bảo mật cá nhân trên repository public.
