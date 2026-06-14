export interface PayOSPaymentPayload {
  orderId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  orderInfo?: string;
}

export interface PayOSCreateResponse {
  success: boolean;
  paymentUrl?: string;
  paymentToken?: string;
  message?: string;
}

export interface PayOSNotification {
  orderId: string;
  status: string;
  transactionId?: string;
  amount?: number;
  signature?: string;
}
