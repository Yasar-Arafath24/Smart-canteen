import { api } from "./client";

export interface OrderItem {
  id: number;
  menu_item_id: number;
  menu_item_name: string | null;
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

/**
 * Get all orders belonging to the current user.
 */
export async function getMyOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>("/orders/me");
  return response.data;
}

/**
 * Get one order by ID.
 */
export async function getOrder(
  orderId: number,
): Promise<Order> {
  const response = await api.get<Order>(
    `/orders/${orderId}`,
  );

  return response.data;
}

/**
 * Cancel an order.
 */
export async function cancelOrder(
  orderId: number,
): Promise<Order> {
  const response = await api.patch<Order>(
    `/orders/${orderId}/cancel`,
  );

  return response.data;
}

/**
 * Delete an order.
 */
export async function deleteOrder(
  orderId: number,
): Promise<void> {
  await api.delete(`/orders/${orderId}`);
}