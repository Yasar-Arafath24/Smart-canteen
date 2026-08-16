import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";

/* ============================================================
   TYPES
============================================================ */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

interface OrderItem {
  id: number;
  menu_item_id: number;
  menu_item_name: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  user_id: number;
  status: OrderStatus | string;
  total: number;
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
}

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

/* ============================================================
   API
============================================================ */

async function getOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>("/orders/");
  return response.data;
}

async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<Order> {
  const response = await api.patch<Order>(
    `/orders/${orderId}/status`,
    {
      status,
    },
  );

  return response.data;
}

async function deleteOrder(
  orderId: number,
): Promise<void> {
  await api.delete(`/orders/${orderId}`);
}

/* ============================================================
   HELPERS
============================================================ */

function getErrorMessage(
  error: any,
  fallback: string,
) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    fallback
  );
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatPrice(
  value: number,
): string {
  return `₹${Number(value).toFixed(2)}`;
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
          <Clock3 size={14} />
          Pending
        </span>
      );

    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          <Check size={14} />
          Confirmed
        </span>
      );

    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
          <Check size={14} />
          Completed
        </span>
      );

    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
          <XCircle size={14} />
          Cancelled
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">
          {status}
        </span>
      );
  }
}

/* ============================================================
   ADMIN ORDERS
============================================================ */

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | OrderStatus>("all");

  const [expandedOrderId, setExpandedOrderId] =
    useState<number | null>(null);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  const [deletingOrderId, setDeletingOrderId] =
    useState<number | null>(null);

  /* ==========================================================
     LOAD ORDERS
  ========================================================== */

  async function loadOrders(
    showLoader = true,
  ) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");
      setSuccess("");

      const data = await getOrders();

      setOrders(data);
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to load orders.",
        ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadOrders(false);
  }

  /* ==========================================================
     UPDATE STATUS
  ========================================================== */

  async function handleStatusChange(
    order: Order,
    newStatus: OrderStatus,
  ) {
    if (order.status === newStatus) {
      return;
    }

    try {
      setUpdatingOrderId(order.id);

      setError("");
      setSuccess("");

      const updatedOrder =
        await updateOrderStatus(
          order.id,
          newStatus,
        );

      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === order.id
            ? updatedOrder
            : currentOrder,
        ),
      );

      setSuccess(
        `Order #${order.id} status updated to ${newStatus}.`,
      );
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to update order status.",
        ),
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  /* ==========================================================
     DELETE ORDER
  ========================================================== */

  async function handleDelete(
    order: Order,
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete Order #${order.id}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOrderId(order.id);

      setError("");
      setSuccess("");

      await deleteOrder(order.id);

      setOrders((current) =>
        current.filter(
          (currentOrder) =>
            currentOrder.id !== order.id,
        ),
      );

      if (
        expandedOrderId === order.id
      ) {
        setExpandedOrderId(null);
      }

      setSuccess(
        `Order #${order.id} deleted successfully.`,
      );
    } catch (err: any) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete order.",
        ),
      );
    } finally {
      setDeletingOrderId(null);
    }
  }

  /* ==========================================================
     FILTER ORDERS
  ========================================================== */

  const filteredOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        String(order.id).includes(
          query,
        ) ||
        String(order.user_id).includes(
          query,
        ) ||
        order.status
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    orders,
    search,
    statusFilter,
  ]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const totalOrders =
    orders.length;

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === "pending",
    ).length;

  const confirmedOrders =
    orders.filter(
      (order) =>
        order.status === "confirmed",
    ).length;

  const completedOrders =
    orders.filter(
      (order) =>
        order.status === "completed",
    ).length;

  const cancelledOrders =
    orders.filter(
      (order) =>
        order.status === "cancelled",
    ).length;

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

          Loading orders...
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

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-purple-100 transition hover:bg-white/20 hover:text-white"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>

              <p className="text-sm font-medium text-purple-200">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Order Management
              </h1>

              <p className="mt-1 text-sm text-purple-200">
                View and manage customer orders.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            PAGE TITLE
        ==================================================== */}

        <div className="mb-8">

          <p className="text-sm font-medium text-[#32145f]">
            Orders
          </p>

          <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
            Manage Customer Orders
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Review orders and update their
            current status.
          </p>

        </div>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400 transition hover:text-red-600"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">

            <Check
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Success
              </p>

              <p className="mt-1">
                {success}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="text-green-500 transition hover:text-green-700"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

          <SummaryCard
            label="Total Orders"
            value={totalOrders}
          />

          <SummaryCard
            label="Pending"
            value={pendingOrders}
          />

          <SummaryCard
            label="Confirmed"
            value={confirmedOrders}
          />

          <SummaryCard
            label="Completed"
            value={completedOrders}
          />

          <SummaryCard
            label="Cancelled"
            value={cancelledOrders}
          />

        </section>

        {/* ====================================================
            ORDERS
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          {/* HEADER / FILTERS */}

          <div className="border-b border-gray-100 p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h3 className="font-bold text-[#24113f]">
                  Orders
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  {filteredOrders.length}{" "}
                  {filteredOrders.length === 1
                    ? "order"
                    : "orders"}{" "}
                  shown
                </p>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                {/* SEARCH */}

                <div className="relative">

                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search order..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-200 focus:bg-white focus:ring-2 focus:ring-purple-50 sm:w-64"
                  />

                </div>

                {/* STATUS FILTER */}

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as
                        | "all"
                        | OrderStatus,
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 outline-none transition focus:border-purple-200 focus:bg-white focus:ring-2 focus:ring-purple-50"
                >

                  <option value="all">
                    All Statuses
                  </option>

                  {ORDER_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status
                          .charAt(0)
                          .toUpperCase() +
                          status.slice(
                            1,
                          )}
                      </option>
                    ),
                  )}

                </select>

              </div>

            </div>

          </div>

          {/* EMPTY */}

          {filteredOrders.length === 0 ? (

            <div className="p-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#32145f]">
                <Package size={28} />
              </div>

              <h3 className="mt-5 font-bold text-[#24113f]">
                {orders.length === 0
                  ? "No orders yet"
                  : "No matching orders"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
                {orders.length === 0
                  ? "Customer orders will appear here once they are created."
                  : "Try changing your search or status filter."}
              </p>

            </div>

          ) : (

            /* ==================================================
               TABLE
            ================================================== */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left">

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Order
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Items
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Total
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Created
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredOrders.map(
                    (order) => {

                      const expanded =
                        expandedOrderId ===
                        order.id;

                      const updating =
                        updatingOrderId ===
                        order.id;

                      const deleting =
                        deletingOrderId ===
                        order.id;

                      return (
                        <OrderRow
                          key={order.id}
                          order={order}
                          expanded={expanded}
                          updating={updating}
                          deleting={deleting}
                          onToggle={() =>
                            setExpandedOrderId(
                              expanded
                                ? null
                                : order.id,
                            )
                          }
                          onStatusChange={
                            handleStatusChange
                          }
                          onDelete={
                            handleDelete
                          }
                        />
                      );
                    },
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="mt-8 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
          >
            <ArrowLeft size={17} />
            Back to Admin Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/menu")
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100"
          >
            Manage Menu
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/inventory")
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100"
          >
            Manage Inventory
          </button>

        </div>

      </main>

    </div>
  );
}

/* ============================================================
   ORDER ROW
============================================================ */

function OrderRow({
  order,
  expanded,
  updating,
  deleting,
  onToggle,
  onStatusChange,
  onDelete,
}: {
  order: Order;
  expanded: boolean;
  updating: boolean;
  deleting: boolean;
  onToggle: () => void;
  onStatusChange: (
    order: Order,
    status: OrderStatus,
  ) => void;
  onDelete: (
    order: Order,
  ) => void;
}) {
  return (
    <>
      <tr className="transition hover:bg-gray-50">

        {/* ORDER */}

        <td className="px-6 py-5">

          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-3 text-left"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
              <Package size={19} />
            </div>

            <div>

              <p className="font-bold text-[#24113f]">
                #{order.id}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Order ID
              </p>

            </div>

          </button>

        </td>

        {/* CUSTOMER */}

        <td className="px-6 py-5">

          <p className="font-semibold text-[#24113f]">
            User #{order.user_id}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Customer ID
          </p>

        </td>

        {/* ITEMS */}

        <td className="px-6 py-5">

          <span className="font-semibold text-gray-700">
            {order.items.length}
          </span>

          <span className="ml-1 text-sm text-gray-400">
            {order.items.length === 1
              ? "item"
              : "items"}
          </span>

        </td>

        {/* TOTAL */}

        <td className="px-6 py-5">

          <span className="font-bold text-[#32145f]">
            {formatPrice(
              order.total,
            )}
          </span>

        </td>

        {/* STATUS */}

        <td className="px-6 py-5">

          <StatusBadge
            status={order.status}
          />

        </td>

        {/* DATE */}

        <td className="px-6 py-5">

          <p className="text-sm font-medium text-gray-600">
            {formatDate(
              order.created_at,
            )}
          </p>

        </td>

        {/* ACTIONS */}

        <td className="px-6 py-5">

          <div className="flex justify-end gap-2">

            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-purple-100 hover:bg-purple-50 hover:text-[#32145f]"
              title={
                expanded
                  ? "Hide order details"
                  : "Show order details"
              }
            >
              {expanded ? (
                <ChevronUp size={17} />
              ) : (
                <ChevronDown size={17} />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                onDelete(order)
              }
              disabled={
                deleting ||
                updating
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="Delete order"
            >
              {deleting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Trash2 size={16} />
              )}
            </button>

          </div>

        </td>

      </tr>

      {/* ======================================================
          EXPANDED DETAILS
      ====================================================== */}

      {expanded && (
        <tr className="bg-gray-50">

          <td
            colSpan={7}
            className="px-6 py-6"
          >

            <div className="rounded-2xl border border-gray-100 bg-white p-5">

              <div className="grid gap-6 lg:grid-cols-[1fr_auto]">

                {/* ITEMS */}

                <div>

                  <h4 className="font-bold text-[#24113f]">
                    Order Items
                  </h4>

                  <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">

                    <table className="w-full">

                      <thead>

                        <tr className="bg-gray-50 text-left">

                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Item ID
                          </th>

                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Quantity
                          </th>

                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Price
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Subtotal
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-gray-100">

                        {order.items.map(
                          (item) => (
                            <tr
                              key={
                                item.id
                              }
                            >

                              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                {
                                  item.menu_item_name ??
                                  `Menu Item #${item.menu_item_id}`
                                }
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.quantity}
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatPrice(
                                  item.price,
                                )}
                              </td>

                              <td className="px-4 py-3 text-right text-sm font-semibold text-[#32145f]">
                                {formatPrice(
                                  item.price *
                                    item.quantity,
                                )}
                              </td>

                            </tr>
                          ),
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

                {/* STATUS CONTROL */}

                <div className="min-w-[250px]">

                  <h4 className="font-bold text-[#24113f]">
                    Update Status
                  </h4>

                  <p className="mt-1 text-sm text-gray-400">
                    Change the current order status.
                  </p>

                  <div className="mt-4">

                    <select
                      value={
                        ORDER_STATUSES.includes(
                          order.status as OrderStatus,
                        )
                          ? order.status
                          : ""
                      }
                      onChange={(event) =>
                        onStatusChange(
                          order,
                          event.target
                            .value as OrderStatus,
                        )
                      }
                      disabled={updating}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:border-purple-200 focus:ring-2 focus:ring-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <option
                        value=""
                        disabled
                      >
                        Select status
                      </option>

                      {ORDER_STATUSES.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status
                              .charAt(
                                0,
                              )
                              .toUpperCase() +
                              status.slice(
                                1,
                              )}
                          </option>
                        ),
                      )}

                    </select>

                    {updating && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">

                        <Loader2
                          size={14}
                          className="animate-spin"
                        />

                        Updating order...

                      </div>
                    )}

                  </div>

                  <div className="mt-5 rounded-xl bg-purple-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-[#32145f]">
                      Order Total
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#24113f]">
                      {formatPrice(
                        order.total,
                      )}
                    </p>

                  </div>

                  {order.updated_at && (
                    <p className="mt-4 text-xs text-gray-400">
                      Last updated:{" "}
                      {formatDate(
                        order.updated_at,
                      )}
                    </p>
                  )}

                </div>

              </div>

            </div>

          </td>

        </tr>
      )}

    </>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      <p className="text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-[#24113f]">
        {value}
      </p>

    </div>
  );
}