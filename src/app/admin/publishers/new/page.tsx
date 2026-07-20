import React from 'react';
import PublisherForm from '../_components/PublisherForm';

export const metadata = { title: "Thêm Nhà Xuất Bản Mới" };

export default function NewPublisherPage() {
    return (
        <div className="container mx-auto p-4">
            <PublisherForm />
        </div>
    );
}
