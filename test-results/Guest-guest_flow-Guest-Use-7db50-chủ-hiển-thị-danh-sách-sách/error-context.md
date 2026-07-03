# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Guest\guest_flow.spec.ts >> Guest User Flows - Kịch bản Khách vãng lai >> TC_G_01: Xem trang chủ hiển thị danh sách sách
- Location: src\tests\Guest\guest_flow.spec.ts:6:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.book-list')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.book-list')

```

```yaml
- text: SĂN DEAL HÈ RỰC RỠ - GIẢM ĐẾN 50% TOÀN BỘ SÁCH NÓI.
- link "XEM NGAY":
  - /url: "#"
- navigation:
  - link "Bibliora":
    - /url: /
  - button "Danh mục expand_more"
  - text: search
  - textbox "Tìm kiếm sách, tác giả..."
  - button "photo_camera"
  - button "shopping_cart"
  - link "login Đăng nhập":
    - /url: /auth/login
- paragraph: Đang mở trang sách Crimson Books...
- contentinfo:
  - text: mail ĐĂNG KÝ NHẬN BẢN TIN
  - textbox "Nhập địa chỉ email của bạn"
  - button "Đăng ký"
  - paragraph: Lầu 5, 387-389 Hai Bà Trưng Quận 3 TP HCM Công Ty Cổ Phần Phát Hành Sách TP HCM 60 - 62 Lê Lợi, Quận 1, TP. HCM, Việt Nam
  - paragraph: Nhận đặt hàng trực tuyến và giao hàng tận nơi. KHÔNG hỗ trợ đặt mua và nhận hàng trực tiếp tại văn phòng.
  - heading "DỊCH VỤ" [level=4]
  - list:
    - listitem:
      - link "Điều khoản sử dụng":
        - /url: "#"
    - listitem:
      - link "Chính sách bảo mật thông tin cá nhân":
        - /url: "#"
    - listitem:
      - link "Chính sách bảo mật thanh toán":
        - /url: "#"
    - listitem:
      - link "Giới thiệu BookStore":
        - /url: "#"
    - listitem:
      - link "Hệ thống nhà sách":
        - /url: "#"
  - heading "HỖ TRỢ" [level=4]
  - list:
    - listitem:
      - link "Chính sách đổi - trả - hoàn tiền":
        - /url: "#"
    - listitem:
      - link "Chính sách bảo hành - bồi hoàn":
        - /url: "#"
    - listitem:
      - link "Chính sách vận chuyển":
        - /url: "#"
    - listitem:
      - link "Chính sách khách sỉ":
        - /url: "#"
    - listitem:
      - link "Phương thức thanh toán":
        - /url: "#"
  - heading "TÀI KHOẢN CỦA TÔI" [level=4]
  - list:
    - listitem:
      - link "Đăng nhập / Tạo mới tài khoản":
        - /url: "#"
    - listitem:
      - link "Thay đổi địa chỉ khách hàng":
        - /url: "#"
    - listitem:
      - link "Chi tiết tài khoản":
        - /url: "#"
    - listitem:
      - link "Lịch sử mua hàng":
        - /url: "#"
  - heading "LIÊN HỆ" [level=4]
  - paragraph: location_on 60-62 Lê Lợi, Q.1, TP. HCM
  - paragraph: mail cskh@bookstore.com.vn
  - paragraph: call 1900 636 467
  - heading "MẠNG XÃ HỘI" [level=4]
  - link "f":
    - /url: "#"
  - link "i":
    - /url: "#"
  - link "y":
    - /url: "#"
  - link "t":
    - /url: "#"
  - text: Giao Hàng Nhanh Viettel Post VNPost Ninja Van VNPAY ZaloPay Momo ShopeePay
  - paragraph: © 2026 BookStore Online. All Rights Reserved.
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Guest User Flows - Kịch bản Khách vãng lai', () => {
  4  | 
  5  |     // TC_G_01: Xem trang chủ
  6  |     test('TC_G_01: Xem trang chủ hiển thị danh sách sách', async ({ page }) => {
  7  |         await page.goto('/');
> 8  |         await expect(page.locator('.book-list')).toBeVisible(); // Thay .book-list bằng class thực tế của bạn
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  9  |     });
  10 | 
  11 |     // TC_G_02: Tìm kiếm sách
  12 |     test('TC_G_02: Tìm kiếm sách theo từ khóa "Mắt Biếc"', async ({ page }) => {
  13 |         await page.goto('/');
  14 |         await page.fill('input[placeholder="Tìm kiếm sách, tác giả..."]', 'Mắt Biếc');
  15 |         await page.press('input[placeholder="Tìm kiếm sách, tác giả..."]', 'Enter');
  16 |         await expect(page.locator('text=Mắt Biếc')).toBeVisible();
  17 |     });
  18 | 
  19 |     // TC_G_03: Xem chi tiết
  20 |     test('TC_G_03: Xem chi tiết thông tin sách', async ({ page }) => {
  21 |         await page.goto('/');
  22 |         await page.click('.book-item >> nth=0'); // Click vào cuốn sách đầu tiên
  23 |         await expect(page.locator('.book-details')).toBeVisible();
  24 |     });
  25 | 
  26 |     // TC_G_04: Giỏ hàng
  27 |     test('TC_G_04: Thêm sách vào giỏ hàng', async ({ page }) => {
  28 |         await page.goto('/book/details/1'); // Cần vào trang chi tiết trước
  29 |         await page.click('button:has-text("Thêm vào giỏ")');
  30 |         // Mong đợi: Hệ thống yêu cầu đăng nhập (theo ghi chú Fail trong Excel của bạn)
  31 |         await expect(page.locator('text=Vui lòng đăng nhập')).toBeVisible();
  32 |     });
  33 | 
  34 |     // TC_G_05: Thanh toán
  35 |     test('TC_G_05: Thanh toán khi chưa đăng nhập', async ({ page }) => {
  36 |         await page.goto('/cart');
  37 |         await page.click('button:has-text("Thanh toán")');
  38 |         await expect(page.locator('text=Vui lòng đăng nhập')).toBeVisible();
  39 |     });
  40 | });
```