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
import Profile from "./pages/customer/Profile";

import AdminDashboard from "./pages/admin/AdminDashboard";

import { CartProvider } from "./context/CartContext";
import SplashScreen from "./components/SplashScreen";

function App() {
  const [stage, setStage] = useState<
    "splash" | "fading" | "done"
  >("splash");

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setStage("fading");
    }, 1200);

    const doneTimer = setTimeout(() => {
      setStage("done");
    }, 1700);

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
            PROFILE
        ========================= */}

        <Route
          path="/profile"
          element={<Profile />}
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
            ADMIN DASHBOARD
        ========================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
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

        {/* =========================
            UNKNOWN ROUTES
        ========================= */}

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