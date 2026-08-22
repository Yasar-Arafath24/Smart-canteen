import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Smartphone,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  createPayment,
  verifyPayment,
} from "../../api/payment";


/* ============================================================
   RAZORPAY TYPES
============================================================ */

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;

  razorpay_order_id: string;

  razorpay_signature: string;
}


interface RazorpayOptions {
  key: string;

  amount: number;

  currency: string;

  name: string;

  description: string;

  order_id: string;

  handler: (
    response: RazorpayPaymentResponse,
  ) => void;

  theme?: {
    color?: string;
  };

  notes?: Record<
    string,
    string
  >;

  modal?: {
    ondismiss?: () => void;
  };
}


interface RazorpayInstance {
  open: () => void;
}


/* ============================================================
   WINDOW TYPE
============================================================ */

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions,
    ) => RazorpayInstance;
  }
}


/* ============================================================
   LOAD RAZORPAY SCRIPT
============================================================ */

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(
    (resolve) => {
      const existingScript =
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
        );

      if (existingScript) {
        resolve(true);
        return;
      }

      const script =
        document.createElement(
          "script",
        );

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(
        script,
      );
    },
  );
}


/* ============================================================
   PAYMENT PAGE
============================================================ */

export default function Payment() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();


  const orderId = Number(
    searchParams.get(
      "orderId",
    ),
  );

  const initialAmount =
    Number(
      searchParams.get(
        "amount",
      ),
    );


  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("upi");


  const [amount, setAmount] =
    useState(
      initialAmount || 0,
    );


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  /* ==========================================================
     START PAYMENT
  ========================================================== */

  async function handlePayment() {
    if (!orderId) {
      setError(
        "Invalid order.",
      );

      return;
    }

    setLoading(true);
    setError("");


    try {
      /* ======================================================
         STEP 1
         CREATE SMARTCANTEEN PAYMENT
      ====================================================== */

      const payment =
        await createPayment({
          order_id: orderId,
          payment_method:
            "razorpay",
        });


      /* ======================================================
         STEP 2
         UPDATE AMOUNT FROM BACKEND
      ====================================================== */

      setAmount(
        Number(
          payment.amount,
        ),
      );


      /* ======================================================
         STEP 3
         LOAD RAZORPAY CHECKOUT
      ====================================================== */

      const scriptLoaded =
        await loadRazorpayScript();


      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay Checkout.",
        );
      }


      /* ======================================================
         STEP 4
         VALIDATE BACKEND RESPONSE
      ====================================================== */

      if (
        !payment.razorpay_order_id
      ) {
        throw new Error(
          "Razorpay order ID was not created.",
        );
      }


      if (
        !payment.razorpay_key_id
      ) {
        throw new Error(
          "Razorpay Key ID was not returned by the server.",
        );
      }


      if (
        !window.Razorpay
      ) {
        throw new Error(
          "Razorpay Checkout is unavailable.",
        );
      }


      /* ======================================================
         STEP 5
         CREATE RAZORPAY CHECKOUT
      ====================================================== */

      const options:
        RazorpayOptions = {
        key:
          payment.razorpay_key_id,

        amount:
          Math.round(
            Number(
              payment.amount,
            ) * 100,
          ),

        currency:
          "INR",

        name:
          "SmartCanteen",

        description:
          `Payment for Order #${orderId}`,

        order_id:
          payment.razorpay_order_id,


        /* ====================================================
           STEP 6
           RAZORPAY SUCCESS CALLBACK
        ==================================================== */

        handler:
          async (
            response,
          ) => {
            try {
              setError("");

              /* ==============================================
                 STEP 7
                 VERIFY PAYMENT ON BACKEND
              ============================================== */

              const verifiedPayment =
                await verifyPayment(
                  payment.id,
                  {
                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_signature:
                      response.razorpay_signature,
                  },
                );


              /* ==============================================
                 STEP 8
                 PAYMENT SUCCESS
              ============================================== */

              if (
                verifiedPayment.status ===
                "paid"
              ) {
                navigate(
                  `/orders/${orderId}`,
                  {
                    replace: true,
                  },
                );

                return;
              }


              setError(
                "Payment verification is still pending.",
              );
            } catch (
              verificationError: any
            ) {
              console.error(
                "Payment verification error:",
                verificationError,
              );

              const detail =
                verificationError
                  ?.response
                  ?.data
                  ?.detail;

              setError(
                typeof detail ===
                  "string"
                  ? detail
                  : "Payment verification failed.",
              );
            } finally {
              setLoading(false);
            }
          },


        theme: {
          color:
            "#32145f",
        },


        notes: {
          order_id:
            String(
              orderId,
            ),
        },


        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };


      /* ======================================================
         THIS IS THE CODE YOU ASKED ABOUT
         
         It belongs HERE inside handlePayment().
      ====================================================== */

      const razorpay =
        new window.Razorpay(
          options,
        );


      razorpay.open();
    } catch (
      paymentError: any
    ) {
      console.error(
        "Payment initialization error:",
        paymentError,
      );

      const detail =
        paymentError
          ?.response
          ?.data
          ?.detail ||
        paymentError?.message ||
        "Unable to start payment.";

      setError(
        typeof detail ===
          "string"
          ? detail
          : "Unable to start payment.",
      );

      setLoading(false);
    }
  }


  /* ==========================================================
     INVALID ORDER
  ========================================================== */

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
            type="button"
            onClick={() =>
              navigate(
                "/dashboard",
              )
            }
            className="mt-7 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-2xl items-center px-6 py-5">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/orders/${orderId}`,
              )
            }
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-purple-200 transition hover:text-white disabled:opacity-50"
          >

            <ArrowLeft
              size={18}
            />

            Back to order

          </button>

        </div>

      </header>


      <main className="mx-auto max-w-2xl px-6 py-10">

        {/* ====================================================
            TITLE
        ==================================================== */}

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


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}


        {/* ====================================================
            AMOUNT
        ==================================================== */}

        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

          <p className="text-sm text-gray-400">
            Amount to pay
          </p>

          <p className="mt-2 text-4xl font-extrabold text-[#24113f]">
            ₹
            {amount
              ? amount.toFixed(
                  2,
                )
              : "0.00"}
          </p>

        </div>


        {/* ====================================================
            PAYMENT METHODS
        ==================================================== */}

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

          <h2 className="font-bold text-[#24113f]">
            Choose payment method
          </h2>

          <div className="mt-5 space-y-3">

            {/* UPI */}

            <button
              type="button"
              onClick={() =>
                setPaymentMethod(
                  "upi",
                )
              }
              disabled={loading}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                paymentMethod ===
                "upi"
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
                  GPay, PhonePe, Paytm and more
                </p>

              </div>

              {paymentMethod ===
                "upi" && (
                <CheckCircle2
                  size={20}
                  className="text-[#32145f]"
                />
              )}

            </button>


            {/* CARD */}

            <button
              type="button"
              onClick={() =>
                setPaymentMethod(
                  "card",
                )
              }
              disabled={loading}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                paymentMethod ===
                "card"
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
                  Visa, Mastercard, RuPay and more
                </p>

              </div>

              {paymentMethod ===
                "card" && (
                <CheckCircle2
                  size={20}
                  className="text-[#32145f]"
                />
              )}

            </button>

          </div>

        </div>


        {/* ====================================================
            PAY
        ==================================================== */}

        <button
          type="button"
          onClick={
            handlePayment
          }
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#32145f] py-4 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {loading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Opening secure checkout...
            </>
          ) : (
            <>
              <CreditCard
                size={18}
              />

              Pay ₹
              {amount
                ? amount.toFixed(
                    2,
                  )
                : "0.00"}
            </>
          )}

        </button>


        <p className="mt-4 text-center text-xs text-gray-400">
          You will complete your payment through Razorpay's secure checkout.
        </p>

      </main>

    </div>
  );
}