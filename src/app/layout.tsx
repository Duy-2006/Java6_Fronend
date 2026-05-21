// app/layout.tsx
import type { Metadata } from "next";
import { Manrope, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const manrope = Manrope({ subsets: ["latin"], weight: ["300","400","500","600","700","800"] });

export const metadata: Metadata = { title: "BookStore Online" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <head>
        {/*  Thêm 2 dòng này */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={`${manrope.className} bg-[#f0f0f0] text-gray-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}