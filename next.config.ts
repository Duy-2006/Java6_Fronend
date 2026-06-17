import type { NextConfig } from "next";

// Lấy địa chỉ Backend từ file .env. Nếu không có (hoặc quên cấu hình), tự động rơi về localhost
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  // Chỉ bật cấu hình IP LAN khi đang chạy dev (chạy npm run dev), 
  // lên production (npm run start) thì Next.js tự động bỏ qua dòng này.
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['192.168.38.99'],
  }),

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Sử dụng biến động thay vì gõ chết IP
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;