import { ArrowLeft, CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { api } from "../../api/client";

interface OrderItemResponse {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
}

interface OrderResponse {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: string;
  updated_at: string | null;
  items: OrderItemResponse[];
}

export default function Checkout() {
  const navigate = useNavigate();

  const {
    items,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePlaceOrder() {
    if (items.length === 0) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post<OrderResponse>("/orders/", {
        items: items.map((cartItem) => ({
          menu_item_id: cartItem.item.id,
          quantity: cartItem.quantity,
        })),
      });

      clearCart();

      navigate(
        `/payment?orderId=${response.data.id}&amount=${response.data.total}`,
      );
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        "Unable to place your order. Please try again.";

      setError(
        typeof message === "string"
          ? message
          : "Unable to place your order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <ShoppingBag
            size={44}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-5 text-2xl font-bold text-[#24113f]">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Add some items before checking out.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-7 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-5">
          <button
            onClick={() => navigate("/cart")}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#32145f] disabled:opacity-50"
          >
            <ArrowLeft size={18} />
            Back to cart
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#32145f]">
            Final step
          </p>

          <h1 className="mt-1 text-3xl font-bold text-[#24113f]">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Review your order before placing it.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#24113f]">
              Order Items
            </h2>

            <div className="mt-6 divide-y divide-gray-100">
              {items.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag
                            size={22}
                            className="text-gray-300"
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-[#24113f]">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">
                        ₹{item.price.toFixed(2)} × {quantity}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 font-semibold text-[#32145f]">
                    ₹
                    {(item.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <aside>
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#24113f]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#24113f]">
                      Total
                    </span>

                    <span className="text-xl font-bold text-[#32145f]">
                      ₹{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#32145f] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Place Order
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                Your order will be created with a pending status.
                Payment will be handled next.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}