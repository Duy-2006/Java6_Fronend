This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


### Danh sách thư viện (requirements.txt) & Vai trò trong TTS Microservice

Microservice xử lý Sách nói (Audiobook) sử dụng Python làm ngôn ngữ lõi. Dưới đây là chức năng của từng thư viện cấu thành nên hệ thống:

| Thư viện | Chức năng / Vai trò chính |
| :--- | :--- |
| **`fastapi`** | Framework lõi để xây dựng các API Endpoints hiệu suất cao. Dùng để tạo các cổng tiếp nhận văn bản cần đọc từ Core Backend (Spring Boot). |
| **`uvicorn`** | Máy chủ web (ASGI Server). Làm nhiệm vụ khởi chạy ứng dụng FastAPI và lắng nghe các luồng request đến ở port `8000`. |
| **`edge-tts`** | Thư viện Text-to-Speech cốt lõi. Chịu trách nhiệm gọi engine của Microsoft Edge để chuyển đổi văn bản (Text) thành tệp âm thanh (Audio/MP3). |
| **`cloudinary`** | SDK kết nối với dịch vụ lưu trữ đám mây. Tự động upload tệp âm thanh sau khi tạo xong lên Cloudinary để tối ưu dung lượng server và trả về URL (Audio Link). |
| **`pydantic`** | Lớp bảo mật và kiểm định (Data Validation). Đảm bảo cấu trúc dữ liệu đầu vào (Schema) từ Spring Boot gửi sang đúng định dạng, không bị thiếu sót trước khi đem đi xử lý. |
| **`python-multipart`** | Hỗ trợ FastAPI tiếp nhận và phân giải các request được gửi dưới chuẩn `multipart/form-data` (hữu ích khi cần upload trực tiếp file text/audio). |