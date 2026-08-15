import { api } from "./client";

export interface PaymentResponse {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  order_id: number;
  payment_method: string;
}

export async function createPayment(
  data: CreatePaymentRequest,
): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>(
    "/payments/",
    data,
  );

  return response.data;
}

export async function getOrderPayment(
  orderId: number,
): Promise<PaymentResponse> {
  const response = await api.get<PaymentResponse>(
    `/payments/order/${orderId}`,
  );

  return response.data;
}

export async function processPayment(
  paymentId: number,
): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>(
    `/payments/${paymentId}/pay`,
  );

  return response.data;
}