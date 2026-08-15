import { api } from "./client";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export async function getMyNotifications(): Promise<Notification[]> {
  const response = await api.get<Notification[]>("/notifications/");
  return response.data;
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<Notification> {
  const response = await api.patch<Notification>(
    `/notifications/${notificationId}/read`,
  );

  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}

export async function deleteNotification(
  notificationId: number,
): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}