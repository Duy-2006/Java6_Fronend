import type { NextConfig } from "next";

// Lấy địa chỉ Backend thực tế. NEXT_PUBLIC_API_URL bây giờ sẽ trỏ về Next.js để làm proxy.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  // Chỉ bật cấu hình IP LAN khi đang chạy dev (chạy npm run dev), 
  // lên production (npm run start) thì Next.js tự động bỏ qua dòng này.
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['localhost', '172.16.42.99', '0.0.0.0'],
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
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        // Dùng 1 RegExp duy nhất để tương thích với validator của Next.js
        ignored: /node_modules|\.git|backend_log\.txt|diff\.txt|temp\.json|TTS-Python-Service|uploads/,
      };
    }
    return config;
  },
};

export default nextConfig;