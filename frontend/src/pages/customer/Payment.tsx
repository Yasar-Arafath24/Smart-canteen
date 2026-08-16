import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  createPayment,
  processPayment,
} from "../../api/payment";

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = Number(searchParams.get("orderId"));
  const amount = Number(searchParams.get("amount"));

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment() {
  if (!orderId) {
    setError("Invalid order.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const pendingPayment = await createPayment({
      order_id: orderId,
      payment_method: paymentMethod,
    });

    const completedPayment = await processPayment(
      pendingPayment.id,
    );

    if (completedPayment.status === "paid") {
      navigate(`/orders/${orderId}`);
      return;
    }

    setError("Payment was not completed.");
  } catch (err: any) {
    const message =
      err.response?.data?.detail ||
      "Payment failed. Please try again.";

    setError(
      typeof message === "string"
        ? message
        : "Payment failed. Please try again.",
    );
  } finally {
    setLoading(false);
  }
}

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <CreditCard
            size={44}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-5 text-2xl font-bold text-[#24113f]">
            Invalid order
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            No order was provided for payment.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-7 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Header */}
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-5">
          <button
            onClick={() =>
              navigate(`/orders/${orderId}`)
            }
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-purple-200 transition hover:text-white disabled:opacity-50"
          >
            <ArrowLeft size={18} />
            Back to order
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <p className="text-sm font-medium text-[#32145f]">
            Secure checkout
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#24113f]">
            Payment
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Order #{orderId}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Amount */}
        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-400">
            Amount to pay
          </p>

          <p className="mt-2 text-4xl font-extrabold text-[#24113f]">
            ₹{amount ? amount.toFixed(2) : "0.00"}
          </p>
        </div>

        {/* Payment methods */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#24113f]">
            Choose payment method
          </h2>

          <div className="mt-5 space-y-3">
            {/* UPI */}
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              disabled={loading}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                paymentMethod === "upi"
                  ? "border-[#32145f] bg-purple-50"
                  : "border-gray-100 hover:border-purple-100"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Smartphone
                size={22}
                className="text-[#32145f]"
              />

              <div className="flex-1">
                <p className="font-semibold text-[#24113f]">
                  UPI
                </p>

                <p className="text-sm text-gray-400">
                  Pay using GPay, PhonePe, Paytm & more
                </p>
              </div>

              {paymentMethod === "upi" && (
                <CheckCircle2
                  size={20}
                  className="text-[#32145f]"
                />
              )}
            </button>

            {/* Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              disabled={loading}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                paymentMethod === "card"
                  ? "border-[#32145f] bg-purple-50"
                  : "border-gray-100 hover:border-purple-100"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <CreditCard
                size={22}
                className="text-[#32145f]"
              />

              <div className="flex-1">
                <p className="font-semibold text-[#24113f]">
                  Credit / Debit Card
                </p>

                <p className="text-sm text-gray-400">
                  Visa, Mastercard, RuPay & more
                </p>
              </div>

              {paymentMethod === "card" && (
                <CheckCircle2
                  size={20}
                  className="text-[#32145f]"
                />
              )}
            </button>
          </div>
        </div>

        {/* Pay button */}
        <button
          type="button"
          onClick={handlePayment}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#32145f] py-4 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Pay ₹{amount ? amount.toFixed(2) : "0.00"}
            </>
          )}
        </button>
      </main>
    </div>
  );
}