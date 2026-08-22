import { api } from "./client";


export interface PaymentResponse {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  razorpay_key_id: string | null;
  created_at: string;
  updated_at: string;
}


export interface CreatePaymentRequest {
  order_id: number;
  payment_method?: string;
}


export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}


export async function createPayment(
  data: CreatePaymentRequest,
): Promise<PaymentResponse> {
  const response =
    await api.post<PaymentResponse>(
      "/payments/",
      {
        order_id: data.order_id,
        payment_method:
          data.payment_method ??
          "razorpay",
      },
    );

  return response.data;
}


export async function getOrderPayment(
  orderId: number,
): Promise<PaymentResponse> {
  const response =
    await api.get<PaymentResponse>(
      `/payments/order/${orderId}`,
    );

  return response.data;
}


export async function verifyPayment(
  paymentId: number,
  data: VerifyPaymentRequest,
): Promise<PaymentResponse> {
  const response =
    await api.post<PaymentResponse>(
      `/payments/${paymentId}/verify`,
      data,
    );

  return response.data;
}