import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests', // Trỏ đúng vào nơi bạn để file test
  use: {
    baseURL: 'http://localhost:3000', // ĐỊA CHỈ TRANG WEB CỦA BẠN
    browserName: 'chromium',
    headless: true, // Chuyển thành false nếu muốn thấy trình duyệt khi chạy
  },
});