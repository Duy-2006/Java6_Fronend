import React from 'react';
import PublisherForm from '../../_components/PublisherForm';

interface EditPublisherPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPublisherPageProps) {
  const { id } = await params;
  return { title: `Cập Nhật Nhà Xuất Bản #${id}` };
}

export default async function EditPublisherPage({ params }: EditPublisherPageProps) {
    const { id } = await params;
    return (
        <div className="container mx-auto p-4">
            <PublisherForm id={parseInt(id, 10)} />
        </div>
    );
}
