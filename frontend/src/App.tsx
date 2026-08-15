import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/auth/Login";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders_temp";
import OrderDetails from "./pages/customer/OrderDetails";

import { CartProvider } from "./context/CartContext";

function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#24113f]">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        SmartCanteen
      </h1>

      <p className="mt-2 text-sm text-purple-200">
        Loading your next meal...
      </p>

      <div className="mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-purple-400" />
      </div>
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return <SplashScreen />;
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