import { api } from "./client";

export interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
}

export async function getMyOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>("/orders/me");
  return response.data;
}

export async function getOrder(orderId: number): Promise<Order> {
  const response = await api.get<Order>(`/orders/${orderId}`);
  return response.data;
}

export async function cancelOrder(orderId: number): Promise<Order> {
  const response = await api.patch<Order>(
    `/orders/${orderId}/cancel`,
  );

  return response.data;
}