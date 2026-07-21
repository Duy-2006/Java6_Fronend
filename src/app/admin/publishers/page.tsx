'use client';

import React, { Suspense } from 'react';
import PublisherManagement from '@/app/admin/_components/PublisherManagement';

export default function PublishersPage() {
    return (
        <div className="w-full space-y-6">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#b70011]" role="status" />
                    <p className="mt-4 text-slate-500 font-medium text-sm">Đang tải cấu hình Nhà xuất bản...</p>
                </div>
            }>
                <PublisherManagement />
            </Suspense>
        </div>
    );
}