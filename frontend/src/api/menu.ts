import { api } from "./client";

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number;
  is_available: boolean;
  stock: number;
  created_at: string;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const response = await api.get<MenuItem[]>("/menu/");
  return response.data;
}

export async function getMenuItem(
  itemId: number,
): Promise<MenuItem> {
  const response = await api.get<MenuItem>(`/menu/${itemId}`);
  return response.data;
}