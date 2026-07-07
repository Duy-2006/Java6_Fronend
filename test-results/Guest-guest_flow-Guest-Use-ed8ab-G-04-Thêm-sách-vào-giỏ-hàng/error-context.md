# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Guest\guest_flow.spec.ts >> Guest User Flows - Kịch bản Khách vãng lai >> TC_G_04: Thêm sách vào giỏ hàng
- Location: src\tests\Guest\guest_flow.spec.ts:27:9

# Error details

```
Error: page.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('button:has-text("Thêm vào giỏ")')

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
  22 |         await page.click('.book-item >> nth=0'); // Click vào cuốn sách đầu tiên
  23 |         await expect(page.locator('.book-details')).toBeVisible();
  24 |     });
  25 | 
  26 |     // TC_G_04: Giỏ hàng
  27 |     test('TC_G_04: Thêm sách vào giỏ hàng', async ({ page }) => {
  28 |         await page.goto('/book/details/1'); // Cần vào trang chi tiết trước
> 29 |         await page.click('button:has-text("Thêm vào giỏ")');
     |                    ^ Error: page.click: Target page, context or browser has been closed
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