import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAllOrders,
  getAllUsers,
  type AdminOrder,
  type AdminUser,
} from "../../api/admin";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [ordersData, usersData] = await Promise.all([
        getAllOrders(),
        getAllUsers(),
      ]);

      setOrders(ordersData);
      setUsers(usersData);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to load admin dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const statistics = useMemo(() => {
    const pending = orders.filter(
      (order) => order.status.toLowerCase() === "pending",
    ).length;

    const confirmed = orders.filter(
      (order) => order.status.toLowerCase() === "confirmed",
    ).length;

    const completed = orders.filter(
      (order) => order.status.toLowerCase() === "completed",
    ).length;

    const cancelled = orders.filter(
      (order) => order.status.toLowerCase() === "cancelled",
    ).length;

    const revenue = orders
      .filter(
        (order) =>
          order.status.toLowerCase() !== "cancelled",
      )
      .reduce(
        (total, order) => total + Number(order.total),
        0,
      );

    return {
      totalOrders: orders.length,
      totalUsers: users.length,
      pending,
      confirmed,
      completed,
      cancelled,
      revenue,
    };
  }, [orders, users]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-[#32145f]">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#24113f]">
              Admin Dashboard
            </h1>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f] disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Unable to load dashboard
              </p>

              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Overview */}
        <section>
          <div className="mb-5">
            <p className="text-sm text-gray-400">
              Overview
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Canteen statistics
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<ShoppingBag size={21} />}
              label="Total Orders"
              value={statistics.totalOrders}
            />

            <StatCard
              icon={<Users size={21} />}
              label="Customers"
              value={statistics.totalUsers}
            />

            <StatCard
              icon={<Clock3 size={21} />}
              label="Pending Orders"
              value={statistics.pending}
            />

            <StatCard
              icon={<Package size={21} />}
              label="Revenue"
              value={`₹${statistics.revenue.toFixed(2)}`}
            />
          </div>
        </section>

        {/* Order status */}
        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm text-gray-400">
              Order status
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Current orders
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              label="Pending"
              value={statistics.pending}
              icon={<Clock3 size={20} />}
              className="bg-yellow-50 text-yellow-700"
            />

            <StatusCard
              label="Confirmed"
              value={statistics.confirmed}
              icon={<CheckCircle2 size={20} />}
              className="bg-purple-50 text-[#32145f]"
            />

            <StatusCard
              label="Completed"
              value={statistics.completed}
              icon={<CheckCircle2 size={20} />}
              className="bg-green-50 text-green-700"
            />

            <StatusCard
              label="Cancelled"
              value={statistics.cancelled}
              icon={<XCircle size={20} />}
              className="bg-red-50 text-red-600"
            />
          </div>
        </section>

        {/* Recent orders */}
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[#24113f]">
                Recent Orders
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Latest orders from all customers
              </p>
            </div>

            <span className="text-sm font-medium text-gray-400">
              {orders.length} total
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <Package
                size={40}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 text-sm text-gray-400">
                No orders found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
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
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 10).map((order) => {
                    const customer = users.find(
                      (user) =>
                        user.id === order.user_id,
                    );

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-5">
                          <span className="font-semibold text-[#24113f]">
                            #{order.id}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div>
                            <p className="font-medium text-[#24113f]">
                              {customer?.name ||
                                `User #${order.user_id}`}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {customer?.email || "—"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-500">
                          {order.items.reduce(
                            (sum, item) =>
                              sum + item.quantity,
                            0,
                          )}
                        </td>

                        <td className="px-6 py-5 font-semibold text-[#32145f]">
                          ₹
                          {Number(
                            order.total,
                          ).toFixed(2)}
                        </td>

                        <td className="px-6 py-5">
                          <OrderStatus
                            status={order.status}
                          />
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-400">
                          {new Date(
                            order.created_at,
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Customers */}
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="font-bold text-[#24113f]">
              Customers
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Registered users
            </p>
          </div>

          {users.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              No users found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.slice(0, 10).map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#24113f]">
                      {user.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold capitalize text-[#32145f]">
                      {user.role}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {user.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Back */}
        <div className="mt-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
          >
            Back to Customer Dashboard
          </button>
        </div>
      </main>
    </div>
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
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
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
  const normalized = status.toLowerCase();

  const styles: Record<string, string> = {
    pending:
      "bg-yellow-50 text-yellow-700 border-yellow-100",

    confirmed:
      "bg-purple-50 text-[#32145f] border-purple-100",

    completed:
      "bg-green-50 text-green-700 border-green-100",

    cancelled:
      "bg-red-50 text-red-600 border-red-100",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[normalized] ||
        "border-gray-100 bg-gray-50 text-gray-500"
      }`}
    >
      {labels[normalized] || status}
    </span>
  );
}