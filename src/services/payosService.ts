const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Lỗi HTTP ${response.status}`);
  }

  return response.json();
};

export interface PayOSCheckoutRequest {
  amount: number;
  orderId: string;
  orderInfo: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

export interface PayOSCheckoutResponse {
  success: boolean;
  paymentUrl?: string;
  message?: string;
}

export async function createPayOSRedirect(payload: PayOSCheckoutRequest): Promise<PayOSCheckoutResponse> {
  return authFetch(`${BASE_URL}/api/pay-os/create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const payosService = {
  createRedirect: createPayOSRedirect,
};
