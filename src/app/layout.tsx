/*
 * layout.tsx (Root Layout)
 * Day la layout goc cua toan bo ung dung Next.js.
 * Moi trang trong du an deu duoc boc ben trong layout nay.
 * Cau hinh tai day: font chu (Manrope, Geist), ngon ngu (vi), va Google Material Icons.
 * Thuoc tinh translate="no" ngan trinh duyet tu dong dich trang (gay loi re-render React).
 */

import type { Metadata } from "next";
import { Manrope, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import Chatbot from "@/components/chatbot/Chatbot";

// Khai bao font Geist (sans-serif) lam font chinh, gan vao bien CSS --font-sans
const geist = Geist({subsets:['latin'],variable:'--font-sans'});

// Khai bao font Manrope voi nhieu trong so de su dung cho cac tieu de va noi dung
const manrope = Manrope({ subsets: ["latin"], weight: ["300","400","500","600","700","800"] });

// Metadata SEO: tieu de trang hien thi tren tab trinh duyet
export const metadata: Metadata = { title: "BookStore Online" };

// Component layout goc - boc toan bo noi dung ung dung
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" translate="no" className={cn("font-sans", geist.variable)}>
      <head>
        {/* Ket noi truoc voi Google Fonts de tang toc tai font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Tai bo icon Material Symbols Outlined tu Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={`${manrope.className} bg-[#f0f0f0] text-gray-800 antialiased`}>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}