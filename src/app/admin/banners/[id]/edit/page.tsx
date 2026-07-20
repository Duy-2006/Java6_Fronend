import React from 'react';
import BannerForm from '../../_components/BannerForm';

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditBannerPageProps) {
  const { id } = await params;
  return { title: `Cập Nhật Banner #${id}` };
}

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const { id } = await params;
  return <BannerForm id={parseInt(id, 10)} />;
}
