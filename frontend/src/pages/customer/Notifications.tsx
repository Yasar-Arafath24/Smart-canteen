import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
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

/* ============================================================
   CUSTOMER NOTIFICATIONS
============================================================ */

export default function Notifications() {
  const navigate = useNavigate();

  /* ==========================================================
     DATA
  ========================================================== */

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  /* ==========================================================
     STATE
  ========================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [markingId, setMarkingId] =
    useState<number | null>(null);

  /* ==========================================================
     WEBSOCKET
  ========================================================== */

  const socketRef = useRef<WebSocket | null>(null);

  const reconnectTimerRef =
    useRef<ReturnType<typeof window.setTimeout> | null>(
      null,
    );

  /* ==========================================================
     LOAD NOTIFICATIONS
  ========================================================== */

  const loadNotifications = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const data = await getMyNotifications();

        setNotifications(
          Array.isArray(data) ? data : [],
        );
      } catch (err) {
        console.error(
          "Notification load error:",
          err,
        );

        setError(
          "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  /* ==========================================================
     WEBSOCKET CONNECTION
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    function connectWebSocket() {
      if (cancelled) {
        return;
      }

      /*
       * IMPORTANT:
       * Change this path only if your backend uses
       * a different notification websocket route.
       */
      const protocol =
        window.location.protocol === "https:"
          ? "wss:"
          : "ws:";

      const websocketUrl =
        `${protocol}//${window.location.host}` +
        `/api/v1/ws/notifications`;

      try {
        const socket = new WebSocket(
          websocketUrl,
        );

        socketRef.current = socket;

        socket.onopen = () => {
          console.log(
            "Notification WebSocket connected.",
          );
        };

        socket.onmessage = (event) => {
          try {
            const incoming =
              JSON.parse(event.data);

            /*
             * Ignore connection/status messages.
             */
            if (
              incoming?.type ===
              "CONNECTED"
            ) {
              return;
            }

            /*
             * The backend notification service
             * sends:
             *
             * id
             * user_id
             * title
             * message
             * type
             * is_read
             * created_at
             *
             * But we intentionally do NOT access
             * incoming.type here because the existing
             * frontend Notification type does not
             * declare it.
             */

            if (
              incoming?.id &&
              incoming?.title &&
              incoming?.message
            ) {
              setNotifications(
                (current) => {
                  const exists =
                    current.some(
                      (item) =>
                        item.id ===
                        incoming.id,
                    );

                  if (exists) {
                    return current;
                  }

                  return [
                    incoming as Notification,
                    ...current,
                  ];
                },
              );

              setSuccess(
                "New notification received.",
              );

              window.setTimeout(() => {
                setSuccess("");
              }, 2500);
            }
          } catch (parseError) {
            console.error(
              "Notification WebSocket parse error:",
              parseError,
            );
          }
        };

        socket.onerror = (event) => {
          console.error(
            "Notification WebSocket error:",
            event,
          );
        };

        socket.onclose = () => {
          socketRef.current = null;

          if (cancelled) {
            return;
          }

          reconnectTimerRef.current =
            window.setTimeout(
              connectWebSocket,
              5000,
            );
        };
      } catch (socketError) {
        console.error(
          "Unable to create notification WebSocket:",
          socketError,
        );
      }
    }

    connectWebSocket();

    return () => {
      cancelled = true;

      if (
        reconnectTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          reconnectTimerRef.current,
        );
      }

      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadNotifications(false);

    setSuccess(
      "Notifications refreshed.",
    );

    window.setTimeout(() => {
      setSuccess("");
    }, 2000);
  }

  /* ==========================================================
     UNREAD COUNT
  ========================================================== */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read,
    ).length;

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
          (notification) =>
            notification.id !==
            notificationId,
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
        "Unable to delete the notification.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ==========================================================
     MARK ONE AS READ
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

    /*
     * Optimistic update.
     */
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

      /*
       * Restore the previous state if
       * the backend request failed.
       */
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
     MARK ALL AS READ
  ========================================================== */

  async function handleMarkAllRead() {
    if (unreadCount === 0) {
      return;
    }

    const previous =
      notifications;

    setError("");

    /*
     * Optimistic update.
     */
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
      })),
    );

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
        "Mark all notifications error:",
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
     MAIN
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-5">

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="flex items-center gap-2 text-sm font-medium text-purple-200 transition hover:text-white"
          >
            <ArrowLeft size={18} />

            Back to menu
          </button>

          <div className="text-center">

            <h1 className="text-xl font-bold text-white">
              Notifications
            </h1>

            <p className="mt-1 text-xs text-purple-200">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "All caught up"}
            </p>

          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-purple-100 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
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

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={
                  handleMarkAllRead
                }
                className="hidden items-center gap-1.5 text-sm font-medium text-purple-100 transition hover:text-white sm:flex"
              >

                <CheckCheck
                  size={16}
                />

                Mark all read
              </button>
            )}

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* ====================================================
            LIVE STATUS
        ==================================================== */}

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 px-4 py-3">

          <div className="flex items-center gap-3">

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">

              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />

            </span>

            <div>

              <p className="text-sm font-semibold text-green-800">
                Live notifications
              </p>

              <p className="text-xs text-green-700">
                New order updates appear automatically.
              </p>

            </div>

          </div>

          {unreadCount > 0 && (
            <span className="rounded-full bg-[#32145f] px-3 py-1 text-xs font-bold text-white">
              {unreadCount} new
            </span>
          )}

        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <BellRing
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400 hover:text-red-600"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {/* ====================================================
            MOBILE MARK ALL
        ==================================================== */}

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={
              handleMarkAllRead
            }
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-semibold text-[#32145f] sm:hidden"
          >

            <CheckCheck size={16} />

            Mark all as read
          </button>
        )}

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-400">

            <Loader2
              size={18}
              className="animate-spin"
            />

            Loading notifications...

          </div>
        )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          !error &&
          notifications.length ===
            0 && (
            <div className="rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#32145f]">

                <Bell size={32} />

              </div>

              <p className="mt-5 font-semibold text-gray-600">
                No notifications yet
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Updates about your orders will appear here.
              </p>

            </div>
          )}

        {/* ====================================================
            NOTIFICATION LIST
        ==================================================== */}

        {!loading &&
          !error &&
          notifications.length >
            0 && (
            <div className="space-y-3">

              {notifications.map(
                (notification) => {

                  const isDeleting =
                    deletingId ===
                    notification.id;

                  const isMarking =
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
                      className={`cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        notification.is_read
                          ? "border-gray-100"
                          : "border-purple-100 bg-purple-50/50"
                      }`}
                    >

                      <div className="flex items-start gap-4">

                        {/* ICON */}

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            notification.is_read
                              ? "border-gray-100 bg-gray-50 text-gray-400"
                              : "border-purple-100 bg-purple-50 text-[#32145f]"
                          }`}
                        >

                          <BellRing
                            size={18}
                          />

                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                            <div className="min-w-0">

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

                            {/* DELETE */}

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
                                isDeleting
                              }
                              className="self-start rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete notification"
                            >

                              {isDeleting ? (
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

                              {isMarking ? (
                                <Loader2
                                  size={
                                    14
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-[#32145f]" />
                              )}

                              {isMarking
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