import { useEffect, useState } from "react";
import { ArrowLeft, Bell, BellRing, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from "../../api/notification";

function formatTime(iso: string) {
  const date = new Date(iso);

  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await getMyNotifications();
        setNotifications(data);
      } catch {
        setError("Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  async function handleDelete(notificationId: number) {
    const confirmed = window.confirm(
      "Delete this notification?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(notificationId);

    try {
      await deleteNotification(notificationId);

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== notificationId,
        ),
      );
    } catch {
      setError("Unable to delete the notification.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMarkAsRead(notification: Notification) {
    if (notification.is_read) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true }
          : item,
      ),
    );

    try {
      await markNotificationAsRead(notification.id);
    } catch {
      // Keep the optimistic update; refresh on next visit.
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) {
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true })),
    );

    try {
      await markAllNotificationsAsRead();
    } catch {
      // Keep the optimistic update; refresh on next visit.
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#32145f]"
          >
            <ArrowLeft size={18} />
            Back to menu
          </button>

          <h1 className="text-xl font-bold text-[#24113f]">
            Notifications
          </h1>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm font-medium text-[#32145f] transition hover:text-[#421b7a]"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            Loading notifications...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          notifications.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center">
              <Bell size={40} className="mx-auto text-gray-300" />

              <p className="mt-4 font-medium text-gray-600">
                No notifications yet
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Updates about your orders will appear here.
              </p>
            </div>
          )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() =>
                  handleMarkAsRead(notification)
                }
                className={`w-full cursor-pointer rounded-2xl border bg-white p-5 text-left transition ${
                  notification.is_read
                    ? "border-gray-100"
                    : "border-purple-100 bg-purple-50/50 hover:border-purple-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <BellRing
                      size={20}
                      className={`mt-0.5 shrink-0 ${
                        notification.is_read
                          ? "text-gray-300"
                          : "text-[#32145f]"
                      }`}
                    />

                    <div className="min-w-0">
                      <p className="font-semibold text-[#24113f]">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.created_at)}
                      </span>

                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-[#32145f]" />
                      )}
                    </div>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      disabled={deletingId === notification.id}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete notification"
                    >
                      {deletingId === notification.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
