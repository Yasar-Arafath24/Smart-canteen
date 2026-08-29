import { api } from "./client";


export interface InventoryItem {
  id: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit: string;
  created_at: string;
  updated_at: string;
}


export interface InventoryCreateData {
  menu_item_id: number;
  quantity: number;
  unit: string;
}


export interface InventoryUpdateData {
  quantity?: number;
  unit?: string;
}


export async function getInventory() {
  const response =
    await api.get<InventoryItem[]>(
      "/inventory/",
    );

  return response.data;
}


export async function createInventory(
  data: InventoryCreateData,
) {
  const response =
    await api.post<InventoryItem>(
      "/inventory/",
      data,
    );

  return response.data;
}


export async function updateInventory(
  inventoryId: number,
  data: InventoryUpdateData,
) {
  const response =
    await api.patch<InventoryItem>(
      `/inventory/${inventoryId}`,
      data,
    );

  return response.data;
}


export async function deleteInventory(
  inventoryId: number,
) {
  const response =
    await api.delete(
      `/inventory/${inventoryId}`,
    );

  return response.data;
}