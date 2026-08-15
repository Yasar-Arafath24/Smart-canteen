import { api } from "./client";

export interface PaymentResponse {
  id: number;
  order_id: number;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
}

export interface CreatePaymentRequest {
  order_id: number;
  payment_method: string;
}

/**
 * Create a payment for an order.
 */
export async function createPayment(
  data: CreatePaymentRequest,
): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>(
    "/payments/",
    data,
  );

  return response.data;
}

/**
 * Get payment information for an order.
 */
export async function getOrderPayment(
  orderId: number,
): Promise<PaymentResponse> {
  const response = await api.get<PaymentResponse>(
    `/payments/order/${orderId}`,
  );

  return response.data;
}
