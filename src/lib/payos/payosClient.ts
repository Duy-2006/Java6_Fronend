import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { PayOSCreateResponse, PayOSNotification, PayOSPaymentPayload } from './payosTypes';

const PAYOS_API_BASE = process.env.PAYOS_API_BASE || 'https://api.payos.vn/v1';
const MERCHANT_ID = process.env.PAYOS_MERCHANT_ID || 'YOUR_PAYOS_MERCHANT_ID';
const MERCHANT_SECRET = process.env.PAYOS_MERCHANT_SECRET || 'YOUR_PAYOS_SECRET';

function buildSignature(payload: Record<string, unknown>) {
  const sortedKeys = Object.keys(payload).sort();
  const raw = sortedKeys
    .filter(key => payload[key] !== undefined && payload[key] !== null && payload[key] !== '')
    .map(key => `${key}=${payload[key]}`)
    .join('&');

  return crypto.createHmac('sha256', MERCHANT_SECRET).update(raw).digest('hex');
}

export function createPayOSPayload(payload: PayOSPaymentPayload) {
  const body = {
    merchant_id: MERCHANT_ID,
    order_id: payload.orderId,
    amount: payload.amount,
    currency: payload.currency || 'VND',
    customer_name: payload.customerName,
    customer_email: payload.customerEmail,
    customer_phone: payload.customerPhone,
    return_url: payload.returnUrl,
    cancel_url: payload.cancelUrl,
    notify_url: payload.notifyUrl,
    order_info: payload.orderInfo || `Thanh toán đơn hàng ${payload.orderId}`,
  };

  const signature = buildSignature(body);
  return { ...body, signature };
}

export async function createPayOSPayment(payload: PayOSPaymentPayload): Promise<PayOSCreateResponse> {
  const requestBody = createPayOSPayload(payload);

  const response = await fetch(`${PAYOS_API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `PayOS API error ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();
  return {
    success: true,
    paymentUrl: data.payment_url || data.redirect_url,
    paymentToken: data.payment_token,
    message: data.message,
  };
}

export function verifyPayOSSignature(query: Record<string, string | undefined>) {
  const payload = {
    merchant_id: query.merchant_id,
    order_id: query.order_id,
    amount: query.amount ? Number(query.amount) : undefined,
    status: query.status,
    transaction_id: query.transaction_id,
  } as Record<string, unknown>;

  const expectedSignature = buildSignature(payload);
  return query.signature === expectedSignature;
}

export function handlePayOSNotification(body: PayOSNotification) {
  const isValid = verifyPayOSSignature({
    merchant_id: MERCHANT_ID,
    order_id: body.orderId,
    amount: body.amount?.toString(),
    status: body.status,
    transaction_id: body.transactionId,
    signature: body.signature,
  });

  if (!isValid) {
    return NextResponse.json({ success: false, message: 'Signature không hợp lệ' }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Notification đã được xác thực' });
}
