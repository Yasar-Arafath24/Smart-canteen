import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/auth/Login";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders_temp";
import OrderDetails from "./pages/customer/OrderDetails";
import Payment from "./pages/customer/Payment";
import Notifications from "./pages/customer/Notifications";

import { CartProvider } from "./context/CartContext";
import SplashScreen from "./components/SplashScreen";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <h1 className="text-3xl font-bold text-[#24113f]">
        {title}
      </h1>
    </div>
  );
}

function App() {
  const [stage, setStage] = useState<
    "splash" | "fading" | "done"
  >("splash");

  useEffect(() => {
    const fadeTimer = setTimeout(
      () => setStage("fading"),
      1200,
    );

    const doneTimer = setTimeout(
      () => setStage("done"),
      1700,
    );

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (stage !== "done") {
    return (
      <SplashScreen fading={stage === "fading"} />
    );
  }

  return (
    <CartProvider>
      <Routes>
        {/* =========================
            LOGIN
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================
            CUSTOMER DASHBOARD
        ========================= */}

        <Route
          path="/dashboard"
          element={<CustomerDashboard />}
        />

        {/* =========================
            CART
        ========================= */}

        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* =========================
            CHECKOUT
        ========================= */}

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        {/* =========================
            PAYMENT
        ========================= */}

        <Route
          path="/payment"
          element={<Payment />}
        />

        {/* =========================
            NOTIFICATIONS
        ========================= */}

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        {/* =========================
            MY ORDERS
        ========================= */}

        <Route
          path="/orders"
          element={<Orders />}
        />

        {/* =========================
            ORDER DETAILS
        ========================= */}

        <Route
          path="/orders/:orderId"
          element={<OrderDetails />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={
            <Placeholder title="Admin Dashboard" />
          }
        />

        {/* =========================
            DEFAULT
        ========================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </CartProvider>
  );
}

export default App;