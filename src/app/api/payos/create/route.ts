import { NextRequest, NextResponse } from 'next/server';
import { createPayOSPayment } from '@/lib/payos/payosClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createPayOSPayment(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Lỗi tạo thanh toán PayOS' }, { status: 500 });
  }
}
