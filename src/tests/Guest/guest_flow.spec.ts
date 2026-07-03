import { test, expect } from '@playwright/test';

test.describe('Guest User Flows - Kịch bản Khách vãng lai', () => {

    // TC_G_01: Xem trang chủ
    test('TC_G_01: Xem trang chủ hiển thị danh sách sách', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.book-list')).toBeVisible(); // Thay .book-list bằng class thực tế của bạn
    });

    // TC_G_02: Tìm kiếm sách
    test('TC_G_02: Tìm kiếm sách theo từ khóa "Mắt Biếc"', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[placeholder="Tìm kiếm sách, tác giả..."]', 'Mắt Biếc');
        await page.press('input[placeholder="Tìm kiếm sách, tác giả..."]', 'Enter');
        await expect(page.locator('text=Mắt Biếc')).toBeVisible();
    });

    // TC_G_03: Xem chi tiết
    test('TC_G_03: Xem chi tiết thông tin sách', async ({ page }) => {
        await page.goto('/');
        await page.click('.book-item >> nth=0'); // Click vào cuốn sách đầu tiên
        await expect(page.locator('.book-details')).toBeVisible();
    });

    // TC_G_04: Giỏ hàng
    test('TC_G_04: Thêm sách vào giỏ hàng', async ({ page }) => {
        await page.goto('/book/details/1'); // Cần vào trang chi tiết trước
        await page.click('button:has-text("Thêm vào giỏ")');
        // Mong đợi: Hệ thống yêu cầu đăng nhập (theo ghi chú Fail trong Excel của bạn)
        await expect(page.locator('text=Vui lòng đăng nhập')).toBeVisible();
    });

    // TC_G_05: Thanh toán
    test('TC_G_05: Thanh toán khi chưa đăng nhập', async ({ page }) => {
        await page.goto('/cart');
        await page.click('button:has-text("Thanh toán")');
        await expect(page.locator('text=Vui lòng đăng nhập')).toBeVisible();
    });
});