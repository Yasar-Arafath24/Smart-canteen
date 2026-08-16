import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";

export default function Cart() {
  const navigate = useNavigate();

  const {
    items,
    totalItems,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa] px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#32145f]"
          >
            <ArrowLeft size={18} />
            Back to menu
          </button>

          <div className="mt-20 rounded-3xl border border-gray-100 bg-white px-6 py-20 text-center shadow-sm">
            <ShoppingCart
              size={48}
              className="mx-auto text-gray-300"
            />

            <h1 className="mt-5 text-2xl font-bold text-[#24113f]">
              Your cart is empty
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Add some meals from today's menu.
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-7 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#421b7a]"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-purple-200 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to menu
          </button>

          <h1 className="text-xl font-bold text-white">
            Your Cart
          </h1>

          <span className="text-sm text-purple-200">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Cart items */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#32145f]">
                  Review your order
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#24113f]">
                  Cart Items
                </h2>
              </div>

              <button
                onClick={clearCart}
                className="text-sm font-medium text-red-500 hover:text-red-600"
              >
                Clear cart
              </button>
            </div>

            <div className="space-y-4">
              {items.map((cartItem) => (
                <article
                  key={cartItem.item.id}
                  className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {cartItem.item.image_url ? (
                      <img
                        src={cartItem.item.image_url}
                        alt={cartItem.item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingCart
                          size={28}
                          className="text-gray-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-[#24113f]">
                          {cartItem.item.name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                          ₹{cartItem.item.price.toFixed(2)} each
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          removeFromCart(cartItem.item.id)
                        }
                        className="text-gray-400 hover:text-red-500"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-xl border border-gray-200">
                        <button
                          onClick={() =>
                            decreaseQuantity(cartItem.item.id)
                          }
                          className="p-2.5 text-gray-500 hover:text-[#32145f]"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="min-w-8 text-center text-sm font-semibold">
                          {cartItem.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(cartItem.item.id)
                          }
                          className="p-2.5 text-gray-500 hover:text-[#32145f]"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <span className="font-bold text-[#32145f]">
                        ₹
                        {(
                          cartItem.item.price *
                          cartItem.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Summary */}
          <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#24113f]">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-medium">
                  {totalItems}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium">
                  ₹{totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Service fee
                </span>

                <span className="font-medium">
                  ₹0.00
                </span>
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

            <button
              onClick={() => navigate("/checkout")}
              className="mt-7 w-full rounded-xl bg-[#32145f] py-3.5 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}