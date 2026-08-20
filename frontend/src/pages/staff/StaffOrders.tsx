import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  getAllOrders,
  updateOrderStatus,
  type AdminOrder,
} from "../../api/admin";

import {
  createAdminDashboardSocket,
  type AdminDashboardEvent,
} from "../../api/adminDashboardSocket";


type OrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

type StatusFilter =
  | "all"
  | OrderStatus;


function normalizeStatus(
  value: string,
): OrderStatus | "unknown" {
  const status =
    value?.toLowerCase().trim();

  if (
    status === "pending" ||
    status === "confirmed" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return status;
  }

  return "unknown";
}


function formatDateTime(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


function getAllowedActions(
  status:
    | OrderStatus
    | "unknown",
): OrderStatus[] {
  switch (status) {
    case "pending":
      return [
        "confirmed",
        "cancelled",
      ];

    case "confirmed":
      return ["completed"];

    default:
      return [];
  }
}


export default function StaffOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<StatusFilter>("all");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    confirmingOrderId,
    setConfirmingOrderId,
  ] = useState<number | null>(null);

  const [
    pendingStatus,
    setPendingStatus,
  ] = useState<OrderStatus | null>(null);

  const [
    liveConnected,
    setLiveConnected,
  ] = useState(false);


  async function loadOrders(
    initial = true,
  ) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data =
        await getAllOrders();

      setOrders(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err: any) {
      console.error(
        "Staff orders error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load staff orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  useEffect(() => {
    loadOrders();
  }, []);


  /*
   * Staff dashboard WebSocket.
   *
   * We use the same event stream already used
   * by the admin dashboard. When an order event
   * arrives, refresh the authoritative order list.
   */
  useEffect(() => {
    const socket =
      createAdminDashboardSocket(
        (
          event: AdminDashboardEvent,
        ) => {
          if (
            event.type ===
              "ORDER_CREATED" ||
            event.type ===
              "ORDER_STATUS_CHANGED"
          ) {
            loadOrders(false);
          }
        },
        (
          connected,
        ) => {
          setLiveConnected(
            connected,
          );
        },
      );

    return () => {
      socket?.close();
    };
  }, []);


  const statistics =
    useMemo(() => {
      const pending =
        orders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) === "pending",
        ).length;

      const confirmed =
        orders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) === "confirmed",
        ).length;

      const completed =
        orders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) === "completed",
        ).length;

      const cancelled =
        orders.filter(
          (order) =>
            normalizeStatus(
              order.status,
            ) === "cancelled",
        ).length;

      return {
        total: orders.length,
        pending,
        confirmed,
        completed,
        cancelled,
      };
    }, [orders]);


  const filteredOrders =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.created_at,
            ).getTime() -
            new Date(
              a.created_at,
            ).getTime(),
        )
        .filter((order) => {
          const status =
            normalizeStatus(
              order.status,
            );

          const matchesSearch =
            !query ||
            String(order.id).includes(
              query,
            ) ||
            String(
              order.user_id,
            ).includes(query);

          const matchesFilter =
            filter === "all" ||
            status === filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        });
    }, [
      orders,
      search,
      filter,
    ]);


  function openConfirmation(
    orderId: number,
    nextStatus: OrderStatus,
  ) {
    setError("");
    setSuccess("");

    setConfirmingOrderId(orderId);
    setPendingStatus(nextStatus);
  }


  function closeConfirmation() {
    if (updatingId !== null) {
      return;
    }

    setConfirmingOrderId(null);
    setPendingStatus(null);
  }


  async function confirmStatusChange() {
    if (
      confirmingOrderId === null ||
      pendingStatus === null
    ) {
      return;
    }

    try {
      setUpdatingId(
        confirmingOrderId,
      );

      setError("");
      setSuccess("");

      const updated =
        await updateOrderStatus(
          confirmingOrderId,
          pendingStatus,
        );

      setOrders((current) =>
        current.map((order) =>
          order.id === updated.id
            ? updated
            : order,
        ),
      );

      setConfirmingOrderId(null);
      setPendingStatus(null);

      setSuccess(
        `Order #${updated.id} updated to ${pendingStatus}.`,
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err: any) {
      console.error(
        "Staff status update error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to update order status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }


  const selectedOrder =
    confirmingOrderId !== null
      ? orders.find(
          (order) =>
            order.id ===
            confirmingOrderId,
        ) ?? null
      : null;


  useEffect(() => {
    if (
      confirmingOrderId !== null &&
      pendingStatus !== null
    ) {
      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          previousOverflow;
      };
    }

    return undefined;
  }, [
    confirmingOrderId,
    pendingStatus,
  ]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading staff orders...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* HEADER */}

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/staff")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-sm text-purple-200">
                Staff Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Order Management
              </h1>

              <p className="mt-1 text-sm text-purple-200">
                Process customer orders and update statuses.
              </p>
            </div>

          </div>


          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white">

              <span
                className={`h-2 w-2 rounded-full ${
                  liveConnected
                    ? "animate-pulse bg-green-400"
                    : "bg-yellow-300"
                }`}
              />

              {liveConnected
                ? "Live"
                : "Connecting..."}

            </div>


            <button
              type="button"
              onClick={() =>
                loadOrders(false)
              }
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] hover:bg-purple-50 disabled:opacity-50"
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={19}
              className="mt-0.5"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

          </div>
        )}


        {/* SUCCESS */}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">

            <CheckCircle2
              size={19}
            />

            <p className="font-semibold">
              {success}
            </p>

          </div>
        )}


        {/* STATS */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

          <OrderStat
            label="All Orders"
            value={statistics.total}
            icon={
              <ClipboardList
                size={20}
              />
            }
          />

          <OrderStat
            label="Pending"
            value={statistics.pending}
            icon={
              <Clock3 size={20} />
            }
            className="bg-yellow-50 text-yellow-700"
          />

          <OrderStat
            label="Confirmed"
            value={statistics.confirmed}
            icon={
              <CheckCircle2
                size={20}
              />
            }
            className="bg-purple-50 text-[#32145f]"
          />

          <OrderStat
            label="Completed"
            value={statistics.completed}
            icon={
              <CheckCircle2
                size={20}
              />
            }
            className="bg-green-50 text-green-700"
          />

          <OrderStat
            label="Cancelled"
            value={statistics.cancelled}
            icon={
              <XCircle size={20} />
            }
            className="bg-red-50 text-red-600"
          />

        </section>


        {/* FILTERS */}

        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div className="relative w-full xl:max-w-xl">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search Order ID or Customer ID..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />

            </div>


            <div className="flex flex-wrap gap-2">

              <FilterButton
                active={
                  filter === "all"
                }
                onClick={() =>
                  setFilter("all")
                }
              >
                All
                <span>
                  {statistics.total}
                </span>
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "pending"
                }
                onClick={() =>
                  setFilter(
                    "pending",
                  )
                }
              >
                Pending
                <span>
                  {statistics.pending}
                </span>
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "confirmed"
                }
                onClick={() =>
                  setFilter(
                    "confirmed",
                  )
                }
              >
                Confirmed
                <span>
                  {statistics.confirmed}
                </span>
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "completed"
                }
                onClick={() =>
                  setFilter(
                    "completed",
                  )
                }
              >
                Completed
                <span>
                  {statistics.completed}
                </span>
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "cancelled"
                }
                onClick={() =>
                  setFilter(
                    "cancelled",
                  )
                }
              >
                Cancelled
                <span>
                  {statistics.cancelled}
                </span>
              </FilterButton>

            </div>

          </div>

        </section>


        {/* TABLE */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <h2 className="font-bold text-[#24113f]">
              Customer Orders
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {filteredOrders.length}{" "}
              order
              {filteredOrders.length !==
              1
                ? "s"
                : ""}{" "}
              shown
            </p>

          </div>


          {filteredOrders.length ===
          0 ? (

            <div className="p-16 text-center">

              <ClipboardList
                size={44}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-5 font-semibold text-[#24113f]">
                No orders found
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Try changing your search or status filter.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Items
                    </th>

                    <th className="px-6 py-4">
                      Total
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100">

                  {filteredOrders.map(
                    (order) => {
                      const status =
                        normalizeStatus(
                          order.status,
                        );

                      const actions =
                        getAllowedActions(
                          status,
                        );

                      const itemCount =
                        order.items?.reduce(
                          (
                            total,
                            item,
                          ) =>
                            total +
                            item.quantity,
                          0,
                        ) ?? 0;

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-5">

                            <p className="font-bold text-[#24113f]">
                              #{order.id}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              User #
                              {order.user_id}
                            </p>

                          </td>


                          <td className="px-6 py-5">

                            <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">
                              Customer #
                              {
                                order.user_id
                              }
                            </span>

                          </td>


                          <td className="px-6 py-5 text-sm text-gray-500">
                            {itemCount}
                          </td>


                          <td className="px-6 py-5 font-bold text-[#32145f]">
                            ₹
                            {Number(
                              order.total ||
                                0,
                            ).toFixed(
                              2,
                            )}
                          </td>


                          <td className="px-6 py-5">

                            <OrderStatus
                              status={
                                status
                              }
                            />

                          </td>


                          <td className="px-6 py-5 text-sm text-gray-400">
                            {formatDateTime(
                              order.created_at,
                            )}
                          </td>


                          <td className="px-6 py-5">

                            {actions.length ===
                            0 ? (

                              <span className="text-xs font-medium text-gray-400">
                                No actions
                              </span>

                            ) : (

                              <div className="flex justify-end gap-2">

                                {actions.includes(
                                  "confirmed",
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openConfirmation(
                                        order.id,
                                        "confirmed",
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-xl bg-[#32145f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#421b7a]"
                                  >
                                    <Check
                                      size={
                                        14
                                      }
                                    />
                                    Confirm
                                  </button>
                                )}


                                {actions.includes(
                                  "cancelled",
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openConfirmation(
                                        order.id,
                                        "cancelled",
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                  >
                                    <XCircle
                                      size={
                                        14
                                      }
                                    />
                                    Cancel
                                  </button>
                                )}


                                {actions.includes(
                                  "completed",
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openConfirmation(
                                        order.id,
                                        "completed",
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                  >
                                    <CheckCircle2
                                      size={
                                        14
                                      }
                                    />
                                    Complete
                                  </button>
                                )}

                              </div>

                            )}

                          </td>

                        </tr>
                      );
                    },
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        <div className="mt-8 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate("/staff")
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:border-purple-100 hover:text-[#32145f]"
          >
            <ArrowLeft size={17} />
            Staff Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/staff/inventory",
              )
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] hover:bg-purple-100"
          >
            Inventory
          </button>

        </div>

      </main>


      {/* ======================================================
          FIXED CONFIRMATION MODAL
          RENDERED DIRECTLY INTO BODY
      ====================================================== */}

      {confirmingOrderId !== null &&
        pendingStatus &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeConfirmation();
              }
            }}
          >

            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-3xl bg-white shadow-2xl"
            >

              <div className="flex items-start justify-between border-b border-gray-100 p-6">

                <div>

                  <p className="text-sm font-medium text-[#32145f]">
                    Order Action
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#24113f]">
                    Update Order #
                    {
                      confirmingOrderId
                    }
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={
                    closeConfirmation
                  }
                  disabled={
                    updatingId !== null
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                >
                  <X size={18} />
                </button>

              </div>


              <div className="p-6">

                <p className="text-sm leading-6 text-gray-500">
                  Confirm changing this order status to:
                </p>


                <div
                  className={`mt-4 rounded-2xl border p-4 ${
                    pendingStatus ===
                    "cancelled"
                      ? "border-red-100 bg-red-50"
                      : pendingStatus ===
                        "completed"
                        ? "border-green-100 bg-green-50"
                        : "border-purple-100 bg-purple-50"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p
                        className={`text-lg font-bold capitalize ${
                          pendingStatus ===
                          "cancelled"
                            ? "text-red-600"
                            : pendingStatus ===
                              "completed"
                              ? "text-green-700"
                              : "text-[#32145f]"
                        }`}
                      >
                        {pendingStatus}
                      </p>

                      {selectedOrder && (
                        <p className="mt-1 text-xs text-gray-500">
                          Current status:{" "}
                          <span className="font-semibold capitalize">
                            {
                              selectedOrder.status
                            }
                          </span>
                        </p>
                      )}

                    </div>

                    {pendingStatus ===
                    "cancelled" ? (
                      <XCircle
                        size={25}
                        className="text-red-500"
                      />
                    ) : (
                      <CheckCircle2
                        size={25}
                        className={
                          pendingStatus ===
                          "completed"
                            ? "text-green-600"
                            : "text-[#32145f]"
                        }
                      />
                    )}

                  </div>

                </div>


                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      closeConfirmation
                    }
                    disabled={
                      updatingId !== null
                    }
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      confirmStatusChange
                    }
                    disabled={
                      updatingId !== null
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 ${
                      pendingStatus ===
                      "cancelled"
                        ? "bg-red-600 hover:bg-red-700"
                        : pendingStatus ===
                          "completed"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-[#32145f] hover:bg-[#421b7a]"
                    }`}
                  >

                    {updatingId !==
                    null ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        Updating...
                      </>
                    ) : (
                      <>
                        <Check
                          size={17}
                        />

                        Confirm
                      </>
                    )}

                  </button>

                </div>

              </div>

            </div>

          </div>,
          document.body,
        )}

    </div>
  );
}


/* ============================================================
   ORDER STAT
============================================================ */

function OrderStat({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f] ${className}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-[#24113f]">
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   FILTER BUTTON
============================================================ */

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
        active
          ? "bg-[#32145f] text-white"
          : "border border-gray-200 bg-white text-gray-500 hover:border-purple-100 hover:text-[#32145f]"
      }`}
    >
      {children}
    </button>
  );
}


/* ============================================================
   ORDER STATUS
============================================================ */

function OrderStatus({
  status,
}: {
  status:
    | OrderStatus
    | "unknown";
}) {
  const styles: Record<
    string,
    string
  > = {
    pending:
      "bg-yellow-50 text-yellow-700 border-yellow-100",

    confirmed:
      "bg-purple-50 text-[#32145f] border-purple-100",

    completed:
      "bg-green-50 text-green-700 border-green-100",

    cancelled:
      "bg-red-50 text-red-600 border-red-100",

    unknown:
      "bg-gray-50 text-gray-500 border-gray-100",
  };

  const labels: Record<
    string,
    string
  > = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    unknown: "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}