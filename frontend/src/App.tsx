import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AdminMenu from "./pages/admin/AdminMenu";
import Login from "./pages/auth/Login";
import AdminOrders from "./pages/admin/AdminOrders";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders_temp";
import OrderDetails from "./pages/customer/OrderDetails";
import Payment from "./pages/customer/Payment";
import Notifications from "./pages/customer/Notifications";
import Profile from "./pages/customer/Profile";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminStaffAttendance from "./pages/admin/AdminStaffAttendance";
import { CartProvider } from "./context/CartContext";
import SplashScreen from "./components/SplashScreen";
import Navbar from "./components/Navbar";
import StaffOrders from "./pages/staff/StaffOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffInventory from "./pages/staff/StaffInventory";
import StaffNotifications from "./pages/staff/StaffNotifications";
import StaffAttendance from "./pages/staff/StaffAttendance";
function CustomerLayout() {
  return (
    <>
      <Navbar role="customer" />
      <Outlet />
    </>
  );
}

function AdminLayout() {
  return (
    <>
      <Navbar role="admin" />
      <Outlet />
    </>
  );
}

function StaffLayout() {
  return (
    <>
      <Navbar role="staff" />
      <Outlet />
    </>
  );
}

function App() {
  const [stage, setStage] = useState<
    "splash" | "fading" | "done"
  >("splash");

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setStage("fading");
    }, 2400);

    const doneTimer = setTimeout(() => {
      setStage("done");
    }, 3000);

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
    <div className="app-enter">
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
            CUSTOMER PAGES
        ========================= */}

        <Route element={<CustomerLayout />}>

          <Route
            path="/dashboard"
            element={<CustomerDashboard />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/payment"
            element={<Payment />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:orderId"
            element={<OrderDetails />}
          />

        </Route>

        {/* =========================
            ADMIN PAGES
        ========================= */}

        <Route element={<AdminLayout />}>

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/orders"
            element={<AdminOrders />}
          />

          <Route
            path="/admin/users"
            element={<AdminUsers />}
          />

          <Route
            path="/admin/inventory"
            element={<AdminInventory />}
          />

          <Route
            path="/admin/menu"
            element={<AdminMenu />}
          />

          <Route
            path="/admin/analytics"
            element={<AdminAnalytics />}
          />

          <Route
            path="/admin/staff-attendance"
            element={<AdminStaffAttendance />}
          />

        </Route>
        <Route
  path="/admin/categories"
  element={<AdminCategories />}
/>
        <Route element={<StaffLayout />}>

          <Route
            path="/staff"
            element={<StaffDashboard />}
          />

          <Route
            path="/staff/orders"
            element={<StaffOrders />}
          />

          <Route
            path="/staff/inventory"
            element={<StaffInventory />}
          />

          <Route
            path="/staff/notifications"
            element={<StaffNotifications />}
          />

          <Route
            path="/staff/attendance"
            element={<StaffAttendance />}
          />

        </Route>

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
    </div>
  );
}

export default App;