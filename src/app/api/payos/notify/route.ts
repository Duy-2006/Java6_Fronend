import { NextRequest } from 'next/server';
import { handlePayOSNotification } from '@/lib/payos/payosClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return handlePayOSNotification(body);
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message || 'Lỗi nhận callback PayOS' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
