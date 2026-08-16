import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from "../../api/notification";

/* ============================================================
   HELPERS
============================================================ */

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const today = new Date();

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  return date.toLocaleDateString(
    [],
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

/* ============================================================
   STAFF NOTIFICATIONS
============================================================ */

export default function StaffNotifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [markingId, setMarkingId] =
    useState<number | null>(null);

  /* ==========================================================
     LOAD
  ========================================================== */

  const loadNotifications =
    useCallback(
      async (
        initial = true,
      ) => {
        try {
          if (initial) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setError("");

          const data =
            await getMyNotifications();

          setNotifications(
            Array.isArray(data)
              ? data
              : [],
          );
        } catch (err: any) {
          console.error(
            "Staff notification error:",
            err,
          );

          setError(
            err?.response?.data
              ?.detail ||
              "Unable to load staff notifications.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  /* ==========================================================
     INITIAL LOAD + AUTO REFRESH
  ========================================================== */

  useEffect(() => {
    loadNotifications(true);

    const interval =
      window.setInterval(() => {
        loadNotifications(false);
      }, 5000);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadNotifications]);

  /* ==========================================================
     COUNTS
  ========================================================== */

  const unreadCount =
    notifications.filter(
      (item) => !item.is_read,
    ).length;

  /* ==========================================================
     MARK ONE READ
  ========================================================== */

  async function handleMarkAsRead(
    notification: Notification,
  ) {
    if (
      notification.is_read ||
      markingId === notification.id
    ) {
      return;
    }

    setMarkingId(notification.id);
    setError("");

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              is_read: true,
            }
          : item,
      ),
    );

    try {
      await markNotificationAsRead(
        notification.id,
      );
    } catch (err) {
      console.error(
        "Mark notification read error:",
        err,
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: false,
              }
            : item,
        ),
      );

      setError(
        "Unable to mark notification as read.",
      );
    } finally {
      setMarkingId(null);
    }
  }

  /* ==========================================================
     MARK ALL READ
  ========================================================== */

  async function handleMarkAllRead() {
    if (unreadCount === 0) {
      return;
    }

    const previous =
      notifications;

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
      })),
    );

    setError("");

    try {
      await markAllNotificationsAsRead();

      setSuccess(
        "All notifications marked as read.",
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error(
        "Mark all notification error:",
        err,
      );

      setNotifications(
        previous,
      );

      setError(
        "Unable to mark all notifications as read.",
      );
    }
  }

  /* ==========================================================
     DELETE
  ========================================================== */

  async function handleDelete(
    notificationId: number,
  ) {
    const confirmed =
      window.confirm(
        "Delete this notification?",
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(notificationId);
    setError("");
    setSuccess("");

    try {
      await deleteNotification(
        notificationId,
      );

      setNotifications((current) =>
        current.filter(
          (item) =>
            item.id !== notificationId,
        ),
      );

      setSuccess(
        "Notification deleted.",
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error(
        "Delete notification error:",
        err,
      );

      setError(
        "Unable to delete notification.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">

        <div className="flex items-center gap-3 text-sm text-gray-400">

          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading staff notifications...

        </div>

      </div>
    );
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-6">

          <button
            type="button"
            onClick={() =>
              navigate("/staff")
            }
            className="flex items-center gap-2 text-sm font-medium text-purple-200 hover:text-white"
          >
            <ArrowLeft size={18} />
            Staff Dashboard
          </button>

          <div className="text-center">

            <h1 className="text-xl font-bold text-white">
              Staff Notifications
            </h1>

            <p className="mt-1 text-xs text-purple-200">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "All caught up"}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              loadNotifications(
                false,
              )
            }
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] hover:bg-purple-50 disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* LIVE STATUS */}

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">

              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />

            </div>

            <div>

              <p className="text-sm font-semibold text-green-800">
                Live staff alerts
              </p>

              <p className="text-xs text-green-700">
                Checking for new notifications automatically.
              </p>

            </div>

          </div>

          {unreadCount > 0 && (
            <span className="rounded-full bg-[#32145f] px-3 py-1 text-xs font-bold text-white">
              {unreadCount} new
            </span>
          )}

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle size={19} />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {/* ACTION */}

        {unreadCount > 0 && (
          <div className="mb-6 flex justify-end">

            <button
              type="button"
              onClick={
                handleMarkAllRead
              }
              className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-[#32145f] hover:bg-purple-100"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>

          </div>
        )}

        {/* EMPTY */}

        {notifications.length ===
        0 ? (

          <div className="rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#32145f]">

              <Bell size={32} />

            </div>

            <h2 className="mt-5 font-semibold text-gray-600">
              No staff notifications
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              New operational alerts will appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {notifications.map(
              (notification) => {

                const deleting =
                  deletingId ===
                  notification.id;

                const marking =
                  markingId ===
                  notification.id;

                return (
                  <article
                    key={
                      notification.id
                    }
                    onClick={() =>
                      handleMarkAsRead(
                        notification,
                      )
                    }
                    className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                      notification.is_read
                        ? "border-gray-100"
                        : "border-purple-100 bg-purple-50/40"
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      {/* ICON */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                          notification.is_read
                            ? "border-gray-100 bg-gray-50 text-gray-400"
                            : "border-purple-100 bg-purple-50 text-[#32145f]"
                        }`}
                      >
                        {notification.is_read ? (
                          <Bell
                            size={19}
                          />
                        ) : (
                          <BellRing
                            size={19}
                          />
                        )}
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h2 className="font-semibold text-[#24113f]">
                                {
                                  notification.title
                                }
                              </h2>

                              {!notification.is_read && (
                                <span className="rounded-full bg-[#32145f] px-2 py-0.5 text-[10px] font-bold text-white">
                                  NEW
                                </span>
                              )}

                            </div>

                            <p className="mt-1 text-xs text-gray-400">
                              {formatTime(
                                notification.created_at,
                              )}
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              handleDelete(
                                notification.id,
                              );
                            }}
                            disabled={
                              deleting
                            }
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting ? (
                              <Loader2
                                size={
                                  16
                                }
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={
                                  16
                                }
                              />
                            )}
                          </button>

                        </div>

                        <p className="mt-3 text-sm leading-6 text-gray-500">
                          {
                            notification.message
                          }
                        </p>

                        {!notification.is_read && (
                          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#32145f]">

                            {marking ? (
                              <Loader2
                                size={
                                  14
                                }
                                className="animate-spin"
                              />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-[#32145f]" />
                            )}

                            {marking
                              ? "Marking as read..."
                              : "Click to mark as read"}

                          </div>
                        )}

                      </div>

                    </div>

                  </article>
                );
              },
            )}

          </div>
        )}

      </main>

    </div>
  );
}