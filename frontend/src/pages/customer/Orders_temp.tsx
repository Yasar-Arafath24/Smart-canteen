import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  cancelOrder,
  deleteOrder,
  getMyOrders,
  type Order,
} from "../../api/order";

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  async function loadOrders() {
    try {
      setError("");
      setLoading(true);

      const data = await getMyOrders();
      setOrders(data);
    } catch {
      setError("Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleCancel(orderId: number) {
    const confirmed = window.confirm(
      `Cancel order #${orderId}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(orderId);
      setError("");

      const updatedOrder = await cancelOrder(orderId);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id
            ? updatedOrder
            : order,
        ),
      );
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
          "Unable to cancel the order.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  async function handleDelete(orderId: number) {
    const confirmed = window.confirm(
      `Delete order #${orderId}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(orderId);
      setError("");

      await deleteOrder(orderId);

      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.id !== orderId),
      );
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
          "Unable to delete the order.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-gray-100 p-2.5 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
              title="Back to dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-xs font-medium text-gray-400">
                Customer
              </p>

              <h1 className="text-xl font-bold text-[#24113f]">
                My Orders
              </h1>
            </div>
          </div>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-purple-100 hover:text-[#32145f] disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#32145f]">
            Order history
          </p>

          <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
            Your orders
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Track and manage your recent food orders.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-100 bg-white">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading your orders...
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
              <ClipboardList
                size={30}
                className="text-[#32145f]"
              />
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#24113f]">
              No orders yet
            </h3>

            <p className="mt-2 max-w-sm text-sm text-gray-400">
              Your orders will appear here after you place your
              first order.
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >
              Browse Menu
            </button>
          </div>
        )}

        {/* Orders */}
        {!loading && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                cancelling={
                  cancellingId === order.id
                }
                deleting={
                  deletingId === order.id
                }
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  order,
  cancelling,
  deleting,
  onCancel,
  onDelete,
}: {
  order: Order;
  cancelling: boolean;
  deleting: boolean;
  onCancel: (orderId: number) => void;
  onDelete: (orderId: number) => void;
}) {
  const formattedDate = new Date(
    order.created_at,
  ).toLocaleString();

  const status = order.status.toLowerCase();

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Top */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
            <Package
              size={21}
              className="text-[#32145f]"
            />
          </div>

          <div>
            <h3 className="font-bold text-[#24113f]">
              Order #{order.id}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <CalendarDays size={14} />
              {formattedDate}
            </div>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Items */}
      <div className="py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Items
        </p>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Menu item #{item.menu_item_id}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Quantity: {item.quantity}
                </p>
              </div>

              <p className="font-semibold text-[#32145f]">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-400">
            Total
          </p>

          <p className="mt-1 text-xl font-bold text-[#24113f]">
            ₹{order.total.toFixed(2)}
          </p>
        </div>

        {status === "pending" && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={cancelling}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Cancelling...
              </>
            ) : (
              <>
                <X size={16} />
                Cancel Order
              </>
            )}
          </button>
        )}

        {status !== "completed" && (
          <button
            onClick={() => onDelete(order.id)}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            title="Delete order"
          >
            {deleting ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

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
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] ||
        "border-gray-100 bg-gray-50 text-gray-500"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}