import React, { Suspense } from 'react';
import BannerList from './_components/BannerList';

export const metadata = {
  title: 'Quản Lý Banner - Libris',
  description: 'Quản lý danh sách banner, quảng cáo trên hệ thống',
};

export default function BannersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 font-sans bg-[#f7f9fb]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang tải trang...</p>
      </div>
    }>
      <BannerList />
    </Suspense>
  );
}