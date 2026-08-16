import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
}

/* ============================================================
   VALID STATUS TRANSITIONS
============================================================ */

const validTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  /* ============================================================
     LOAD ORDERS
  ============================================================ */

  async function loadOrders() {
    try {
      setError("");

      const response = await api.get<Order[]>("/orders/");

      setOrders(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to load orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* ============================================================
     REFRESH
  ============================================================ */

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders();
  }

  /* ============================================================
     CHANGE ORDER STATUS
  ============================================================ */

  async function handleStatusChange(
    orderId: number,
    newStatus: string,
  ) {
    if (!newStatus) {
      return;
    }

    try {
      setUpdatingId(orderId);
      setError("");

      /*
       * IMPORTANT:
       * Backend expects:
       *
       * {
       *   "status": "confirmed"
       * }
       */

      const response = await api.patch<Order>(
        `/orders/${orderId}/status`,
        {
          status: newStatus,
        },
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? response.data
            : order,
        ),
      );
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to update order status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /* ============================================================
     STATUS ICON
  ============================================================ */

  function statusIcon(status: string) {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <CheckCircle2
            size={16}
            className="text-green-600"
          />
        );

      case "completed":
        return (
          <CheckCircle2
            size={16}
            className="text-blue-600"
          />
        );

      case "cancelled":
        return (
          <XCircle
            size={16}
            className="text-red-500"
          />
        );

      default:
        return (
          <Clock3
            size={16}
            className="text-orange-500"
          />
        );
    }
  }

  /* ============================================================
     STATUS STYLE
  ============================================================ */

  function statusClass(status: string) {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-100";

      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-100";

      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";

      default:
        return "bg-orange-50 text-orange-700 border-orange-100";
    }
  }

  /* ============================================================
     FORMAT STATUS
  ============================================================ */

  function formatStatus(status: string) {
    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }

  /* ============================================================
     GET AVAILABLE NEXT STATUSES
  ============================================================ */

  function getNextStatuses(status: string) {
    return (
      validTransitions[
        status.toLowerCase()
      ] || []
    );
  }

  /* ============================================================
     LOADING
  ============================================================ */

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

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate("/admin")}
              className="rounded-xl border border-gray-100 p-2.5 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
              title="Back to admin dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-xs font-medium text-gray-400">
                Administration
              </p>

              <h1 className="text-xl font-bold text-[#24113f]">
                Order Management
              </h1>
            </div>

          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f] disabled:opacity-50"
          >
            <RefreshCw
              size={17}
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

      {/* ======================================================
          MAIN
      ======================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            HEADING
        ===================================================== */}

        <div className="mb-8">

          <p className="text-sm font-medium text-[#32145f]">
            Orders
          </p>

          <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
            Manage Orders
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Review customer orders and update their status.
          </p>

        </div>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ====================================================
            SUMMARY
        ===================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-400">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-bold text-[#24113f]">
              {orders.length}
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-400">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {
                orders.filter(
                  (order) =>
                    order.status.toLowerCase() ===
                    "pending",
                ).length
              }
            </p>
          </div>

          {/* CONFIRMED */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-400">
              Confirmed
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                orders.filter(
                  (order) =>
                    order.status.toLowerCase() ===
                    "confirmed",
                ).length
              }
            </p>
          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-400">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {
                orders.filter(
                  (order) =>
                    order.status.toLowerCase() ===
                    "completed",
                ).length
              }
            </p>
          </div>

        </div>

        {/* ====================================================
            ORDERS TABLE
        ===================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-6 py-5">

            <h3 className="font-bold text-[#24113f]">
              All Orders
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Latest orders from all customers
            </p>

          </div>

          {/* NO ORDERS */}

          {orders.length === 0 ? (

            <div className="px-6 py-16 text-center">
              <p className="text-gray-400">
                No orders found.
              </p>
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                {/* ==================================================
                    TABLE HEADER
                =================================================== */}

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left">

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
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Action
                    </th>

                  </tr>

                </thead>

                {/* ==================================================
                    TABLE BODY
                =================================================== */}

                <tbody>

                  {orders.map((order) => {

                    const currentStatus =
                      order.status.toLowerCase();

                    const nextStatuses =
                      getNextStatuses(
                        currentStatus,
                      );

                    const isUpdating =
                      updatingId === order.id;

                    const canChange =
                      nextStatuses.length > 0;

                    return (

                      <tr
                        key={order.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                      >

                        {/* ORDER ID */}

                        <td className="px-6 py-5">

                          <p className="font-bold text-[#24113f]">
                            #{order.id}
                          </p>

                        </td>

                        {/* CUSTOMER */}

                        <td className="px-6 py-5">

                          <p className="text-sm font-semibold text-gray-700">
                            User #{order.user_id}
                          </p>

                        </td>

                        {/* ITEMS */}

                        <td className="px-6 py-5">

                          <p className="text-sm text-gray-600">
                            {order.items.reduce(
                              (sum, item) =>
                                sum + item.quantity,
                              0,
                            )}
                          </p>

                        </td>

                        {/* TOTAL */}

                        <td className="px-6 py-5">

                          <p className="text-sm font-semibold text-gray-700">
                            ₹{order.total.toFixed(2)}
                          </p>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusClass(
                              order.status,
                            )}`}
                          >
                            {statusIcon(
                              order.status,
                            )}

                            {formatStatus(
                              order.status,
                            )}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="px-6 py-5">

                          <p className="text-sm text-gray-500">
                            {new Date(
                              order.created_at,
                            ).toLocaleDateString()}
                          </p>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2">

                            <select
                              value=""
                              disabled={
                                isUpdating ||
                                !canChange
                              }
                              onChange={(event) =>
                                handleStatusChange(
                                  order.id,
                                  event.target.value,
                                )
                              }
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#32145f] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                            >

                              <option
                                value=""
                                disabled
                              >
                                {canChange
                                  ? "Change status"
                                  : "No changes"}
                              </option>

                              {nextStatuses.map(
                                (nextStatus) => (
                                  <option
                                    key={
                                      nextStatus
                                    }
                                    value={
                                      nextStatus
                                    }
                                  >
                                    {formatStatus(
                                      nextStatus,
                                    )}
                                  </option>
                                ),
                              )}

                            </select>

                            {isUpdating && (
                              <Loader2
                                size={17}
                                className="animate-spin text-[#32145f]"
                              />
                            )}

                          </div>

                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}