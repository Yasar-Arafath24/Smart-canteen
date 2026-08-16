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
   INVENTORY
============================================================ */

/*
 * The exact fields returned by InventoryOut depend on
 * backend/app/schemas/inventory.py.
 *
 * The common fields below are optional so this API layer
 * remains compatible with your current backend schema.
 */

export interface AdminInventory {
  id: number;

  name?: string;
  item_name?: string;

  quantity?: number;
  stock?: number;
  current_stock?: number;

  low_stock_threshold?: number;

  menu_item_id?: number;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

/*
 * InventoryCreate / InventoryUpdate payloads.
 *
 * These are intentionally flexible until we inspect
 * backend/app/schemas/inventory.py.
 */

export type InventoryCreateData = Record<string, unknown>;

export type InventoryUpdateData = Record<string, unknown>;

/* ============================================================
   MENU ITEM
============================================================ */

/*
 * MenuItemResponse fields depend on
 * backend/app/schemas/menu.py.
 *
 * Common fields are included here and additional backend
 * fields are allowed.
 */

export interface AdminMenuItem {
  id: number;

  name?: string;
  description?: string;

  price?: number;

  category_id?: number;
  category?: string;

  image_url?: string;

  is_available?: boolean;
  available?: boolean;

  created_at?: string;
  updated_at?: string;

  [key: string]: unknown;
}

export type MenuCreateData = Record<string, unknown>;

export type MenuUpdateData = Record<string, unknown>;

/* ============================================================
   USERS
============================================================ */

/**
 * GET /users/
 */
export async function getAllUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>("/users/");

  return response.data;
}

/**
 * GET /users/{user_id}
 */
export async function getUser(
  userId: number,
): Promise<AdminUser> {
  const response = await api.get<AdminUser>(
    `/users/${userId}`,
  );

  return response.data;
}

/**
 * PATCH /users/{user_id}
 */
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

/**
 * Deactivate user
 */
export async function deactivateUser(
  userId: number,
): Promise<AdminUser> {
  return updateUser(userId, {
    is_active: false,
  });
}

/**
 * Activate user
 */
export async function activateUser(
  userId: number,
): Promise<AdminUser> {
  return updateUser(userId, {
    is_active: true,
  });
}

/**
 * Make user admin
 */
export async function makeUserAdmin(
  userId: number,
): Promise<AdminUser> {
  return updateUser(userId, {
    role: "admin",
  });
}

/**
 * Make user customer
 */
export async function makeUserCustomer(
  userId: number,
): Promise<AdminUser> {
  return updateUser(userId, {
    role: "customer",
  });
}

/* ============================================================
   ORDERS
============================================================ */

/**
 * GET /orders/
 */
export async function getAllOrders(): Promise<AdminOrder[]> {
  const response = await api.get<AdminOrder[]>("/orders/");

  return response.data;
}

/**
 * GET /orders/{order_id}
 */
export async function getAdminOrder(
  orderId: number,
): Promise<AdminOrder> {
  const response = await api.get<AdminOrder>(
    `/orders/${orderId}`,
  );

  return response.data;
}

/**
 * PATCH /orders/{order_id}/status
 */
export async function updateOrderStatus(
  orderId: number,
  status: string,
): Promise<AdminOrder> {
  const response = await api.patch<AdminOrder>(
    `/orders/${orderId}/status`,
    {
      status,
    },
  );

  return response.data;
}

/**
 * DELETE /orders/{order_id}
 */
export async function deleteAdminOrder(
  orderId: number,
): Promise<void> {
  await api.delete(`/orders/${orderId}`);
}

/* ============================================================
   INVENTORY
============================================================ */

/**
 * GET /inventory/
 *
 * Customer/Admin
 */
export async function getAllInventory(): Promise<
  AdminInventory[]
> {
  const response = await api.get<AdminInventory[]>(
    "/inventory/",
  );

  return response.data;
}

/**
 * GET /inventory/{inventory_id}
 *
 * Customer/Admin
 */
export async function getInventoryItem(
  inventoryId: number,
): Promise<AdminInventory> {
  const response = await api.get<AdminInventory>(
    `/inventory/${inventoryId}`,
  );

  return response.data;
}

/**
 * POST /inventory/
 *
 * Admin only
 */
export async function createInventory(
  data: InventoryCreateData,
): Promise<AdminInventory> {
  const response = await api.post<AdminInventory>(
    "/inventory/",
    data,
  );

  return response.data;
}

/**
 * PUT /inventory/{inventory_id}
 *
 * Admin only
 */
export async function updateInventory(
  inventoryId: number,
  data: InventoryUpdateData,
): Promise<AdminInventory> {
  const response = await api.put<AdminInventory>(
    `/inventory/${inventoryId}`,
    data,
  );

  return response.data;
}

/**
 * PATCH /inventory/{inventory_id}
 *
 * Admin only
 */
export async function patchInventory(
  inventoryId: number,
  data: InventoryUpdateData,
): Promise<AdminInventory> {
  const response = await api.patch<AdminInventory>(
    `/inventory/${inventoryId}`,
    data,
  );

  return response.data;
}

/**
 * DELETE /inventory/{inventory_id}
 *
 * Admin only
 */
export async function deleteInventory(
  inventoryId: number,
): Promise<void> {
  await api.delete(`/inventory/${inventoryId}`);
}

/* ============================================================
   MENU
============================================================ */

/**
 * GET /menu/
 *
 * Public
 */
export async function getAllMenuItems(): Promise<
  AdminMenuItem[]
> {
  const response = await api.get<AdminMenuItem[]>(
    "/menu/",
  );

  return response.data;
}

/**
 * GET /menu/{item_id}
 *
 * Public
 */
export async function getMenuItem(
  itemId: number,
): Promise<AdminMenuItem> {
  const response = await api.get<AdminMenuItem>(
    `/menu/${itemId}`,
  );

  return response.data;
}

/**
 * POST /menu/
 *
 * Admin only
 */
export async function createMenuItem(
  data: MenuCreateData,
): Promise<AdminMenuItem> {
  const response = await api.post<AdminMenuItem>(
    "/menu/",
    data,
  );

  return response.data;
}

/**
 * PUT /menu/{item_id}
 *
 * Admin only
 */
export async function updateMenuItem(
  itemId: number,
  data: MenuUpdateData,
): Promise<AdminMenuItem> {
  const response = await api.put<AdminMenuItem>(
    `/menu/${itemId}`,
    data,
  );

  return response.data;
}

/**
 * DELETE /menu/{item_id}
 *
 * Admin only
 */
export async function deleteMenuItem(
  itemId: number,
): Promise<void> {
  await api.delete(`/menu/${itemId}`);
}

/**
 * Toggle menu availability.
 *
 * This uses the existing PUT /menu/{item_id} endpoint.
 *
 * IMPORTANT:
 * The exact property expected by MenuItemUpdate must be
 * confirmed from backend/app/schemas/menu.py.
 */
export async function toggleMenuItemAvailability(
  item: AdminMenuItem,
  available: boolean,
): Promise<AdminMenuItem> {
  return updateMenuItem(item.id, {
    is_available: available,
  });
}