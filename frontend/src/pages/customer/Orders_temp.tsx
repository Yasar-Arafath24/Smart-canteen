import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getMyOrders,
  type Order,
} from "../../api/order";

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyOrders();

      setOrders(data);
    } catch (err: any) {
      console.error("Failed to load orders:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load orders. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function getStatusIcon(status: string) {
    switch (status) {
      case "confirmed":
        return (
          <CheckCircle2
            size={18}
            className="text-[#32145f]"
          />
        );

      case "completed":
        return (
          <CheckCircle2
            size={18}
            className="text-green-600"
          />
        );

      case "cancelled":
        return (
          <XCircle
            size={18}
            className="text-red-500"
          />
        );

      case "pending":
      default:
        return (
          <Clock3
            size={18}
            className="text-yellow-600"
          />
        );
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case "confirmed":
        return "border-purple-100 bg-purple-50 text-[#32145f]";

      case "completed":
        return "border-green-100 bg-green-50 text-green-700";

      case "cancelled":
        return "border-red-100 bg-red-50 text-red-600";

      case "pending":
      default:
        return "border-yellow-100 bg-yellow-50 text-yellow-700";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "confirmed":
        return "Confirmed";

      case "completed":
        return "Completed";

      case "cancelled":
        return "Cancelled";

      case "pending":
        return "Pending";

      default:
        return status;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading your orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Header */}
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-purple-200 transition hover:text-white"
          >
            <ArrowLeft size={18} />

            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#32145f]">
              Your orders
            </p>

            <h1 className="mt-1 text-3xl font-bold text-[#24113f]">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              View and track your previous orders.
            </p>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f] disabled:opacity-50"
          >
            <RefreshCw size={16} />

            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <XCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-500"
              />

              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  Unable to load orders
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  onClick={loadOrders}
                  className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No orders */}
        {!error && orders.length === 0 && (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
              <Package
                size={30}
                className="text-[#32145f]"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#24113f]">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              You haven't placed any orders yet. Browse the
              menu and place your first order.
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-7 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >
              Browse Menu
            </button>
          </div>
        )}

        {/* Orders */}
        {!error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => {
              const status =
                order.status.toLowerCase();

              const itemCount = order.items.reduce(
                (sum, item) =>
                  sum + item.quantity,
                0,
              );

              return (
                <button
                  key={order.id}
                  onClick={() =>
                    navigate(`/orders/${order.id}`)
                  }
                  className="group w-full rounded-3xl border border-gray-100 bg-white p-6 text-left shadow-sm transition hover:border-purple-100 hover:shadow-md"
                >
                  {/* Top */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                        <Package
                          size={21}
                          className="text-[#32145f]"
                        />
                      </div>

                      <div>
                        <h2 className="font-bold text-[#24113f]">
                          Order #{order.id}
                        </h2>

                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                          <CalendarDays size={14} />

                          {new Date(
                            order.created_at,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div
                      className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                        status,
                      )}`}
                    >
                      {getStatusIcon(status)}

                      {getStatusLabel(status)}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-5 border-t border-gray-100" />

                  {/* Order information */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-400">
                        Items
                      </p>

                      <p className="mt-1 font-semibold text-[#24113f]">
                        {itemCount}{" "}
                        {itemCount === 1
                          ? "item"
                          : "items"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Total
                      </p>

                      <p className="mt-1 font-bold text-[#32145f]">
                        ₹{order.total.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Order status
                      </p>

                      <p className="mt-1 font-semibold capitalize text-[#24113f]">
                        {status}
                      </p>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-500">
                      Order items
                    </p>

                    <div className="mt-2 space-y-1">
                      {order.items
                        .slice(0, 3)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-4 text-sm"
                          >
                            <span className="text-gray-600">
                              {
                                item.menu_item_name ??
                                `Menu item #${item.menu_item_id}`
                              }{" "}
                              × {item.quantity}
                            </span>

                            <span className="font-medium text-gray-700">
                              ₹
                              {(
                                item.price *
                                item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}

                      {order.items.length > 3 && (
                        <p className="pt-1 text-xs text-gray-400">
                          +{" "}
                          {order.items.length - 3}{" "}
                          more item
                          {order.items.length - 3 !== 1
                            ? "s"
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Click to view order details
                    </span>

                    <span className="text-sm font-semibold text-[#32145f] transition group-hover:translate-x-1">
                      View Order →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}