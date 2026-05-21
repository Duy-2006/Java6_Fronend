# Hướng Dẫn Chạy Dự Án Trên Windows PowerShell 🚀

Tài liệu này hướng dẫn chi tiết cách cài đặt, cấu hình và chạy dự án **Next.js (bookstore-frontend)** bằng **PowerShell** trên hệ điều hành Windows.

---

## 📋 Yêu Cầu Hệ Thống Trước Khi Chạy

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

1. **Node.js** (Khuyến nghị phiên bản LTS mới nhất - v18 hoặc v20+).
2. **NPM** (Đi kèm khi cài đặt Node.js).

> [!TIP]
> Bạn có thể kiểm tra xem máy đã cài đặt Node.js & NPM chưa bằng cách mở PowerShell và chạy lệnh:
> ```powershell
> node -v
> npm -v
> ```
> Nếu các lệnh trên trả về số phiên bản (ví dụ: `v20.11.0`), bạn đã sẵn sàng! Nếu chưa, hãy tải và cài đặt tại [Node.js Official Website](https://nodejs.org/).

---

## 🏃 Các Bước Chạy Dự Án Bằng PowerShell

Hãy thực hiện tuần tự các bước dưới đây trong PowerShell để chạy dự án:

### Bước 1: Mở PowerShell và di chuyển vào thư mục dự án
1. Nhấp phím `Windows` (hoặc mở Start Menu), gõ **PowerShell** và mở nó lên.
2. Chuyển ổ đĩa sang ổ **D** (nơi chứa dự án) bằng cách nhập:
   ```powershell
   d:
   ```
3. Di chuyển vào thư mục dự án `Java6` bằng lệnh `cd`:
   ```powershell
   cd d:\Java6
   ```

### Bước 2: Bỏ qua chính sách hạn chế chạy Script của PowerShell (Nếu cần)
Trên hệ điều hành Windows, PowerShell thường chặn việc chạy một số script không được ký số. Để tránh các lỗi liên quan đến quyền thực thi khi chạy các lệnh npm, hãy chạy lệnh sau trong cửa sổ PowerShell của bạn:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
> [!NOTE]
> Lệnh trên chỉ bỏ qua chính sách hạn chế tạm thời cho phiên làm việc (cửa sổ PowerShell) hiện tại, đảm bảo an toàn bảo mật cho máy tính của bạn sau khi đóng cửa sổ.

### Bước 3: Cài đặt các thư viện phụ thuộc (Dependencies)
Nếu đây là lần đầu tiên bạn chạy dự án hoặc sau khi cập nhật mã nguồn mới, bạn cần cài đặt các thư viện cần thiết bằng lệnh:
```powershell
npm install
```
*(Nếu thư mục `node_modules` đã tồn tại và đầy đủ, bạn có thể bỏ qua bước này).*

### Bước 4: Khởi chạy dự án ở chế độ Phát Triển (Development)
Chạy lệnh sau để khởi động máy chủ thử nghiệm cục bộ:
```powershell
npm run dev
```

Sau khi máy chủ khởi động thành công, bạn sẽ thấy thông báo tương tự như sau trong PowerShell:
```text
▲ Next.js 16.2.1
- Local:        http://localhost:3000
```

### Bước 5: Truy cập ứng dụng trên Trình Duyệt 🌐
Mở trình duyệt web của bạn (Chrome, Edge, Firefox,...) và truy cập đường dẫn sau:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Một Số Lệnh Hữu Ích Khác

| Lệnh | Chức năng |
| :--- | :--- |
| `npm run build` | Biên dịch và đóng gói ứng dụng để đưa lên production. |
| `npm run start` | Chạy ứng dụng đã được đóng gói (cần chạy `build` trước). |
| `npm run lint` | Kiểm tra lỗi cú pháp và định dạng mã nguồn (ESLint). |

---

## ⚠️ Giải Quyết Các Sự Cố Thường Gặp (Troubleshooting)

### 1. Lỗi cổng 3000 đã bị sử dụng (Port 3000 is already in use)
Nếu có một ứng dụng khác đang chạy ở cổng 3000, bạn có thể tìm và tắt nó bằng các lệnh PowerShell sau:
* **Tìm ID tiến trình (PID) đang dùng cổng 3000:**
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
  ```
* **Tắt tiến trình đó (Thay `<PID>` bằng số ID tìm thấy được ở lệnh trên):**
  ```powershell
  Stop-Process -Id <PID> -Force
  ```
* *Hoặc Next.js sẽ tự động hỏi bạn có muốn chạy ở cổng khác không (ví dụ: `3001`). Bạn chỉ cần nhấn `Y` để đồng ý.*

### 2. Lỗi "npm : The term 'npm' is not recognized..."
* **Nguyên nhân:** Node.js chưa được cài đặt hoặc chưa được thêm vào biến môi trường `PATH`.
* **Cách khắc phục:** Cài đặt lại Node.js và tích chọn mục "Add to PATH" trong quá trình cài đặt. Sau đó **khởi động lại máy tính** hoặc tắt hoàn toàn PowerShell đi và mở lại.
