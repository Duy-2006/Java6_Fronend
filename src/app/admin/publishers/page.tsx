import React from 'react';
import PublisherList from './_components/PublisherList';

export const metadata = { title: "Quản Lý Nhà Xuất Bản" };

export default function PublishersPage() {
    return (
        <div className="container mx-auto p-4">
            <PublisherList />
        </div>
    );
}