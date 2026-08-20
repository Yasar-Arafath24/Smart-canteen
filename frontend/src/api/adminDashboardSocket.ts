export interface AdminDashboardEvent {
  type: string;

  order_id?: number;
  user_id?: number;
  status?: string;
  previous_status?: string;
  total?: number;

  menu_item_id?: number;
  quantity?: number;
}

function getWebSocketBaseUrl() {
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api/v1";

  return apiUrl
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");
}

export function createAdminDashboardSocket(
  onEvent: (
    event: AdminDashboardEvent
  ) => void,
  onConnectionChange?: (
    connected: boolean
  ) => void,
) {
  const token =
    localStorage.getItem(
      "access_token",
    );

  if (!token) {
    return null;
  }

  const url =
    `${getWebSocketBaseUrl()}` +
    `/dashboard/ws?token=${encodeURIComponent(
      token,
    )}`;

  const socket =
    new WebSocket(url);

  socket.onopen = () => {
    onConnectionChange?.(
      true
    );
  };

  socket.onmessage = (
    message,
  ) => {
    try {
      const event =
        JSON.parse(
          message.data,
        ) as AdminDashboardEvent;

      onEvent(event);
    } catch (error) {
      console.error(
        "Invalid admin dashboard event:",
        error,
      );
    }
  };

  socket.onerror = () => {
    onConnectionChange?.(
      false
    );
  };

  socket.onclose = () => {
    onConnectionChange?.(
      false
    );
  };

  return socket;
}