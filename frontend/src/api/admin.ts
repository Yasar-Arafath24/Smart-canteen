import { api } from "./client";

/* ============================================================
   ADMIN USER
============================================================ */

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

/* ============================================================
   ADMIN ORDER ITEM
============================================================ */

export interface AdminOrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
}

/* ============================================================
   ADMIN ORDER
============================================================ */

export interface AdminOrder {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: string;
  updated_at: string | null;
  items: AdminOrderItem[];
}

/* ============================================================
   GET ALL USERS
   Backend:
   GET /users/
============================================================ */

export async function getAllUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>("/users/");
  return response.data;
}

/* ============================================================
   GET ONE USER
   Backend:
   GET /users/{user_id}
============================================================ */

export async function getUser(
  userId: number,
): Promise<AdminUser> {
  const response = await api.get<AdminUser>(
    `/users/${userId}`,
  );

  return response.data;
}

/* ============================================================
   UPDATE USER
   Backend:
   PATCH /users/{user_id}
============================================================ */

export async function updateUser(
  userId: number,
  data: {
    name?: string;
    email?: string;
    role?: string;
    is_active?: boolean;
  },
): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(
    `/users/${userId}`,
    data,
  );

  return response.data;
}

/* ============================================================
   GET ALL ORDERS
   Backend:
   GET /orders/
============================================================ */

export async function getAllOrders(): Promise<AdminOrder[]> {
  const response = await api.get<AdminOrder[]>("/orders/");
  return response.data;
}

/* ============================================================
   GET ONE ORDER
   Backend:
   GET /orders/{order_id}
============================================================ */

export async function getAdminOrder(
  orderId: number,
): Promise<AdminOrder> {
  const response = await api.get<AdminOrder>(
    `/orders/${orderId}`,
  );

  return response.data;
}

/* ============================================================
   UPDATE ORDER STATUS
   Backend:
   PATCH /orders/{order_id}/status
============================================================ */

export async function updateOrderStatus(
  orderId: number,
  status: string,
): Promise<AdminOrder> {
  const response = await api.patch<AdminOrder>(
    `/orders/${orderId}/status`,
    status,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

/* ============================================================
   DELETE ORDER
   Backend:
   DELETE /orders/{order_id}
============================================================ */

export async function deleteAdminOrder(
  orderId: number,
): Promise<void> {
  await api.delete(`/orders/${orderId}`);
}