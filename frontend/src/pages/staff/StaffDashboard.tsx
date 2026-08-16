import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getAllOrders,
  type AdminOrder,
} from "../../api/admin";

import { api } from "../../api/client";

/* ============================================================
   TYPES
============================================================ */

interface InventoryItem {
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit: string;
}

/* ============================================================
   STAFF DASHBOARD
============================================================ */

export default function StaffDashboard() {
  const navigate = useNavigate();

  /* ==========================================================
     DATA
  ========================================================== */

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ==========================================================
     ERROR
  ========================================================== */

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  async function loadDashboard(
    showInitialLoading = true,
  ) {
    try {
      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [
        ordersData,
        inventoryResponse,
      ] = await Promise.all([
        getAllOrders(),
        api.get<InventoryItem[]>(
          "/inventory/",
        ),
      ]);

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : [],
      );

      setInventory(
        Array.isArray(
          inventoryResponse.data,
        )
          ? inventoryResponse.data
          : [],
      );
    } catch (err: any) {
      console.error(
        "Staff dashboard load error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load staff dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics = useMemo(() => {
    const pending =
      orders.filter(
        (order) =>
          order.status
            ?.toLowerCase() ===
          "pending",
      ).length;

    const confirmed =
      orders.filter(
        (order) =>
          order.status
            ?.toLowerCase() ===
          "confirmed",
      ).length;

    const completed =
      orders.filter(
        (order) =>
          order.status
            ?.toLowerCase() ===
          "completed",
      ).length;

    const cancelled =
      orders.filter(
        (order) =>
          order.status
            ?.toLowerCase() ===
          "cancelled",
      ).length;

    const revenue =
      orders
        .filter(
          (order) =>
            order.status
              ?.toLowerCase() !==
            "cancelled",
        )
        .reduce(
          (total, order) =>
            total +
            Number(
              order.total || 0,
            ),
          0,
        );

    const lowStock =
      inventory.filter(
        (item) =>
          item.quantity > 0 &&
          item.quantity <= 5,
      ).length;

    const outOfStock =
      inventory.filter(
        (item) =>
          item.quantity <= 0,
      ).length;

    return {
      totalOrders:
        orders.length,
      pending,
      confirmed,
      completed,
      cancelled,
      revenue,
      lowStock,
      outOfStock,
    };
  }, [orders, inventory]);

  /* ==========================================================
     RECENT ORDERS
  ========================================================== */

  const recentOrders = useMemo(() => {
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
      .slice(0, 8);
  }, [orders]);

  /* ==========================================================
     STOCK ALERTS
  ========================================================== */

  const stockAlerts = useMemo(() => {
    return [...inventory]
      .filter(
        (item) =>
          item.quantity <= 5,
      )
      .sort(
        (a, b) =>
          a.quantity -
          b.quantity,
      )
      .slice(0, 6);
  }, [inventory]);

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

          Loading staff dashboard...

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

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-medium text-purple-200">
              Staff Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white">
              Staff Dashboard
            </h1>

            <p className="mt-1 text-sm text-purple-200">
              Manage orders and monitor canteen operations.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard(false)
            }
            disabled={refreshing}
            className="flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
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
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Unable to load dashboard
              </p>

              <p className="mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadDashboard()
                }
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>

            </div>

          </div>
        )}

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <section className="mb-10">

          <div className="mb-5">

            <p className="text-sm text-gray-400">
              Staff Operations
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Work with customer orders and inventory.
            </p>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <ActionCard
              icon={
                <ClipboardList
                  size={22}
                />
              }
              title="Manage Orders"
              description="Review orders and update valid order statuses."
              onClick={() =>
                navigate(
                  "/staff/orders",
                )
              }
            />

            <ActionCard
              icon={
                <Package size={22} />
              }
              title="Inventory"
              description="Monitor current stock and handle restocking."
              onClick={() =>
                navigate(
                  "/staff/inventory",
                )
              }
            />

            <ActionCard
              icon={
                <BellIcon />
              }
              title="Notifications"
              description="View order and system notifications."
              onClick={() =>
                navigate(
                  "/notifications",
                )
              }
            />

          </div>

        </section>

        {/* ====================================================
            MAIN STATS
        ==================================================== */}

        <section>

          <div className="mb-5">

            <p className="text-sm text-gray-400">
              Operations
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Overview
            </h2>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              icon={
                <ShoppingBag
                  size={21}
                />
              }
              label="Total Orders"
              value={
                statistics.totalOrders
              }
            />

            <StatCard
              icon={
                <Clock3
                  size={21}
                />
              }
              label="Pending Orders"
              value={
                statistics.pending
              }
            />

            <StatCard
              icon={
                <CheckCircle2
                  size={21}
                />
              }
              label="Completed"
              value={
                statistics.completed
              }
            />

            <StatCard
              icon={
                <Package
                  size={21}
                />
              }
              label="Revenue"
              value={`₹${statistics.revenue.toFixed(
                2,
              )}`}
            />

          </div>

        </section>

        {/* ====================================================
            ORDER STATUS
        ==================================================== */}

        <section className="mt-10">

          <div className="mb-5">

            <p className="text-sm text-gray-400">
              Orders
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Order Status
            </h2>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatusCard
              label="Pending"
              value={
                statistics.pending
              }
              icon={
                <Clock3
                  size={20}
                />
              }
              className="bg-yellow-50 text-yellow-700"
            />

            <StatusCard
              label="Confirmed"
              value={
                statistics.confirmed
              }
              icon={
                <CheckCircle2
                  size={20}
                />
              }
              className="bg-purple-50 text-[#32145f]"
            />

            <StatusCard
              label="Completed"
              value={
                statistics.completed
              }
              icon={
                <CheckCircle2
                  size={20}
                />
              }
              className="bg-green-50 text-green-700"
            />

            <StatusCard
              label="Cancelled"
              value={
                statistics.cancelled
              }
              icon={
                <XCircle
                  size={20}
                />
              }
              className="bg-red-50 text-red-600"
            />

          </div>

        </section>

        {/* ====================================================
            STOCK ALERTS
        ==================================================== */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-bold text-[#24113f]">
                Stock Alerts
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Items that need staff attention.
              </p>

            </div>

            <div className="flex gap-2">

              <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
                {statistics.lowStock} low
              </span>

              <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                {statistics.outOfStock} out
              </span>

            </div>

          </div>

          {stockAlerts.length ===
          0 ? (

            <div className="p-10 text-center">

              <CheckCircle2
                size={38}
                className="mx-auto text-green-500"
              />

              <p className="mt-4 font-semibold text-[#24113f]">
                Stock looks good
              </p>

              <p className="mt-1 text-sm text-gray-400">
                No current low-stock items need attention.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {stockAlerts.map(
                (item) => (

                  <div
                    key={
                      item.menu_item_id
                    }
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                        <Package
                          size={19}
                        />
                      </div>

                      <div>

                        <p className="font-semibold text-[#24113f]">
                          {
                            item.menu_item_name
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {
                            item.quantity
                          }{" "}
                          {
                            item.unit
                          }{" "}
                          remaining
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          item.quantity <=
                          0
                            ? "bg-red-50 text-red-600"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {item.quantity <=
                        0
                          ? "Out of stock"
                          : "Low stock"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/staff/inventory",
                          )
                        }
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-purple-100 hover:bg-purple-50 hover:text-[#32145f]"
                      >
                        Restock
                        <ArrowRight
                          size={14}
                        />
                      </button>

                    </div>

                  </div>

                ),
              )}

            </div>

          )}

        </section>

        {/* ====================================================
            RECENT ORDERS
        ==================================================== */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-bold text-[#24113f]">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Latest customer orders.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/staff/orders",
                )
              }
              className="flex items-center gap-2 self-start rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100"
            >
              View All Orders
              <ArrowRight
                size={16}
              />
            </button>

          </div>

          {recentOrders.length ===
          0 ? (

            <div className="p-10 text-center">

              <Package
                size={40}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 font-semibold text-[#24113f]">
                No orders found
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      Order
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

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {recentOrders.map(
                    (order) => {

                      const itemCount =
                        order.items?.reduce(
                          (
                            sum,
                            item,
                          ) =>
                            sum +
                            item.quantity,
                          0,
                        ) ?? 0;

                      return (
                        <tr
                          key={order.id}
                          className="transition hover:bg-gray-50"
                        >

                          <td className="px-6 py-5">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  "/staff/orders",
                                )
                              }
                              className="font-semibold text-[#32145f] hover:underline"
                            >
                              #{order.id}
                            </button>

                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500">
                            {itemCount}
                          </td>

                          <td className="px-6 py-5 font-semibold text-[#32145f]">
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
                                order.status
                              }
                            />

                          </td>

                          <td className="px-6 py-5 text-sm text-gray-400">
                            {new Date(
                              order.created_at,
                            ).toLocaleDateString()}
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

      </main>

    </div>
  );
}

/* ============================================================
   BELL ICON
============================================================ */

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-[22px] w-[22px]"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17H9m9-2V11a6 6 0 10-12 0v4l-2 2h16l-2-2z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 20h4"
      />
    </svg>
  );
}

/* ============================================================
   ACTION CARD
============================================================ */

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-purple-100 hover:shadow-md"
    >

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#32145f]"
        />

      </div>

      <h3 className="mt-5 font-bold text-[#24113f]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-5 text-gray-400">
        {description}
      </p>

    </button>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
        {icon}
      </div>

      <p className="mt-5 text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-[#24113f]">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   STATUS CARD
============================================================ */

function StatusCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-transparent p-5 ${className}`}
    >

      <div className="flex items-center justify-between">

        <span className="text-sm font-semibold">
          {label}
        </span>

        {icon}

      </div>

      <p className="mt-4 text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   ORDER STATUS
============================================================ */

function OrderStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    status?.toLowerCase() ||
    "unknown";

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
  };

  const labels: Record<
    string,
    string
  > = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[normalized] ||
        "border-gray-100 bg-gray-50 text-gray-500"
      }`}
    >
      {labels[normalized] ||
        status}
    </span>
  );
}