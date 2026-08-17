import type { ActivityLog } from "./activity";


function getWebSocketBaseUrl() {
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api/v1";

  return apiUrl
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");
}


export function createActivitySocket(
  onActivity: (
    activity: ActivityLog
  ) => void,
  onError?: () => void,
) {
  const token =
    localStorage.getItem(
      "access_token",
    );

  if (!token) {
    return null;
  }

  const wsUrl =
    `${getWebSocketBaseUrl()}` +
    `/activity/ws?token=${encodeURIComponent(
      token,
    )}`;

  const socket =
    new WebSocket(wsUrl);

  socket.onmessage = (
    event,
  ) => {
    try {
      const activity =
        JSON.parse(
          event.data,
        ) as ActivityLog;

      onActivity(activity);
    } catch (error) {
      console.error(
        "Invalid activity WebSocket message:",
        error,
      );
    }
  };

  socket.onerror = () => {
    console.error(
      "Activity WebSocket connection failed.",
    );

    onError?.();
  };

  return socket;
}