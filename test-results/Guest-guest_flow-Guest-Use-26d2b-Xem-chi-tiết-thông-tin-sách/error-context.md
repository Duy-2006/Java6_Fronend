# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Guest\guest_flow.spec.ts >> Guest User Flows - Kịch bản Khách vãng lai >> TC_G_03: Xem chi tiết thông tin sách
- Location: src\tests\Guest\guest_flow.spec.ts:20:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.book-item').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - text: SĂN DEAL HÈ RỰC RỠ - GIẢM ĐẾN 50% TOÀN BỘ SÁCH NÓI.
      - link "XEM NGAY" [ref=e4] [cursor=pointer]:
        - /url: "#"
    - navigation [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "Bibliora" [ref=e8] [cursor=pointer]:
            - /url: /
            - generic [ref=e9]: Bibliora
          - button "Danh mục expand_more" [ref=e12]:
            - text: Danh mục
            - generic [ref=e13]: expand_more
        - generic [ref=e15]:
          - generic [ref=e16]: search
          - textbox "Tìm kiếm sách, tác giả..." [ref=e17]
          - button "photo_camera" [ref=e18]:
            - generic [ref=e19]: photo_camera
        - generic [ref=e20]:
          - button "shopping_cart" [ref=e21]:
            - generic [ref=e22]: shopping_cart
          - link "login Đăng nhập" [ref=e23] [cursor=pointer]:
            - /url: /auth/login
            - generic [ref=e24]: login
            - text: Đăng nhập
    - paragraph [ref=e28]: Đang mở trang sách Crimson Books...
    - contentinfo [ref=e29]:
      - generic [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e33]: mail
          - text: ĐĂNG KÝ NHẬN BẢN TIN
        - generic [ref=e35]:
          - textbox "Nhập địa chỉ email của bạn" [ref=e36]
          - button "Đăng ký" [ref=e37]
      - generic [ref=e38]:
        - generic [ref=e39]:
          - generic [ref=e40]:
            - paragraph [ref=e41]:
              - text: Lầu 5, 387-389 Hai Bà Trưng Quận 3 TP HCM
              - text: Công Ty Cổ Phần Phát Hành Sách TP HCM
              - text: 60 - 62 Lê Lợi, Quận 1, TP. HCM, Việt Nam
            - paragraph [ref=e42]: Nhận đặt hàng trực tuyến và giao hàng tận nơi. KHÔNG hỗ trợ đặt mua và nhận hàng trực tiếp tại văn phòng.
          - generic [ref=e43]:
            - heading "DỊCH VỤ" [level=4] [ref=e44]
            - list [ref=e45]:
              - listitem [ref=e46]:
                - link "Điều khoản sử dụng" [ref=e47] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e48]:
                - link "Chính sách bảo mật thông tin cá nhân" [ref=e49] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e50]:
                - link "Chính sách bảo mật thanh toán" [ref=e51] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e52]:
                - link "Giới thiệu BookStore" [ref=e53] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e54]:
                - link "Hệ thống nhà sách" [ref=e55] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e56]:
            - heading "HỖ TRỢ" [level=4] [ref=e57]
            - list [ref=e58]:
              - listitem [ref=e59]:
                - link "Chính sách đổi - trả - hoàn tiền" [ref=e60] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e61]:
                - link "Chính sách bảo hành - bồi hoàn" [ref=e62] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e63]:
                - link "Chính sách vận chuyển" [ref=e64] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e65]:
                - link "Chính sách khách sỉ" [ref=e66] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e67]:
                - link "Phương thức thanh toán" [ref=e68] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e69]:
            - heading "TÀI KHOẢN CỦA TÔI" [level=4] [ref=e70]
            - list [ref=e71]:
              - listitem [ref=e72]:
                - link "Đăng nhập / Tạo mới tài khoản" [ref=e73] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e74]:
                - link "Thay đổi địa chỉ khách hàng" [ref=e75] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e76]:
                - link "Chi tiết tài khoản" [ref=e77] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e78]:
                - link "Lịch sử mua hàng" [ref=e79] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e80]:
            - generic [ref=e81]:
              - heading "LIÊN HỆ" [level=4] [ref=e82]
              - paragraph [ref=e83]:
                - generic [ref=e84]: location_on
                - text: 60-62 Lê Lợi, Q.1, TP. HCM
              - paragraph [ref=e85]:
                - generic [ref=e86]: mail
                - text: cskh@bookstore.com.vn
              - paragraph [ref=e87]:
                - generic [ref=e88]: call
                - text: 1900 636 467
            - generic [ref=e89]:
              - heading "MẠNG XÃ HỘI" [level=4] [ref=e90]
              - generic [ref=e91]:
                - link "f" [ref=e92] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e93]: f
                - link "i" [ref=e94] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e95]: i
                - link "y" [ref=e96] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e97]: "y"
                - link "t" [ref=e98] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e99]: t
        - generic [ref=e100]:
          - generic [ref=e101]:
            - generic [ref=e102]: Giao Hàng Nhanh
            - generic [ref=e103]: Viettel Post
            - generic [ref=e104]: VNPost
            - generic [ref=e105]: Ninja Van
          - generic [ref=e106]:
            - generic [ref=e107]: VNPAY
            - generic [ref=e108]: ZaloPay
            - generic [ref=e109]: Momo
            - generic [ref=e110]: ShopeePay
        - paragraph [ref=e112]: © 2026 BookStore Online. All Rights Reserved.
  - button "Open Next.js Dev Tools" [ref=e118] [cursor=pointer]:
    - img [ref=e119]
  - alert [ref=e122]
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
  8  |         await expect(page.locator('.book-list')).toBeVisible(); // Thay .book-list bằng class thực tế của bạn
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
> 22 |         await page.click('.book-item >> nth=0'); // Click vào cuốn sách đầu tiên
     |                    ^ Error: page.click: Test timeout of 30000ms exceeded.
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