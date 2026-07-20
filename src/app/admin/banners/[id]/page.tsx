import React from 'react';
import BannerDetailClient from '../_components/BannerDetailClient';

interface BannerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BannerDetailPageProps) {
  const { id } = await params;
  return { title: `Chi tiết Banner #${id}` };
}

export default async function BannerDetailPage({ params }: BannerDetailPageProps) {
  const { id } = await params;
  return <BannerDetailClient id={parseInt(id, 10)} />;
}
