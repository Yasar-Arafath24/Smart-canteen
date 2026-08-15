import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  cancelOrder,
  getOrder,
  type Order,
} from "../../api/order";

export default function OrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  async function loadOrder() {
    if (!orderId) {
      setError("Invalid order.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getOrder(Number(orderId));
      setOrder(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to load order details.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function handleCancel() {
    if (!order) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel order #${order.id}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);
      setError("");

      const updatedOrder = await cancelOrder(order.id);

      setOrder(updatedOrder);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to cancel the order.",
      );
    } finally {
      setCancelling(false);
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
          Loading order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <XCircle
            size={44}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-5 text-2xl font-bold text-[#24113f]">
            Unable to load order
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            {error || "Order not found."}
          </p>

          <button
            onClick={() => navigate("/orders")}
            className="mt-7 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
          >
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  const status = order.status.toLowerCase();

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-5">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#32145f]"
          >
            <ArrowLeft size={18} />
            My Orders
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <p className="text-sm font-medium text-[#32145f]">
            Order details
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-[#24113f]">
              Order #{order.id}
            </h1>

            <StatusBadge status={status} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <CalendarDays size={16} />

            {new Date(order.created_at).toLocaleString()}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Order items */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <Package
                  size={20}
                  className="text-[#32145f]"
                />
              </div>

              <div>
                <h2 className="font-bold text-[#24113f]">
                  Order Items
                </h2>

                <p className="text-xs text-gray-400">
                  {order.items.length} item
                  {order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-gray-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div>
                    <h3 className="font-semibold text-[#24113f]">
                      Menu item #{item.menu_item_id}
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      ₹{item.price.toFixed(2)} ×{" "}
                      {item.quantity}
                    </p>
                  </div>

                  <span className="font-bold text-[#32145f]">
                    ₹
                    {(item.price * item.quantity).toFixed(
                      2,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Summary */}
          <aside>
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#24113f]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Order ID</span>
                  <span>#{order.id}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Status</span>
                  <span className="font-medium capitalize">
                    {status}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Items</span>
                  <span>
                    {order.items.reduce(
                      (sum, item) =>
                        sum + item.quantity,
                      0,
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#24113f]">
                      Total
                    </span>

                    <span className="text-xl font-bold text-[#32145f]">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending */}
              {status === "pending" && (
                <div className="mt-7">
                  <div className="mb-4 rounded-xl bg-yellow-50 p-4">
                    <div className="flex gap-3">
                      <Clock3
                        size={19}
                        className="mt-0.5 shrink-0 text-yellow-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          Order is pending
                        </p>

                        <p className="mt-1 text-xs leading-5 text-yellow-700">
                          Your order has been received and is
                          waiting for confirmation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelling ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle size={17} />
                        Cancel Order
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Confirmed */}
              {status === "confirmed" && (
                <div className="mt-7 rounded-xl bg-purple-50 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0 text-[#32145f]"
                    />

                    <div>
                      <p className="text-sm font-semibold text-[#32145f]">
                        Order confirmed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-purple-700">
                        Your order has been confirmed and is
                        being prepared.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed */}
              {status === "completed" && (
                <div className="mt-7 rounded-xl bg-green-50 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0 text-green-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Order completed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700">
                        Your order has been completed successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {status === "cancelled" && (
                <div className="mt-7 rounded-xl bg-red-50 p-4">
                  <div className="flex gap-3">
                    <XCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Order cancelled
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-600">
                        This order has been cancelled.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Bottom actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate("/orders")}
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
          >
            View All Orders
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
          >
            Order More Food
          </button>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: string;
}) {
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
      className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] ||
        "border-gray-100 bg-gray-50 text-gray-500"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}