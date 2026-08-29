import { useEffect, useState } from "react";

import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

/* ============================================================
   ADMIN PAGES
============================================================ */

import AdminMenu from "./pages/admin/AdminMenu";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminStaffAttendance from "./pages/admin/AdminStaffAttendance";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminProfile from "./pages/admin/AdminProfile";

/* ============================================================
   STAFF PAGES
============================================================ */

import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrders from "./pages/staff/StaffOrders";
import StaffInventory from "./pages/staff/StaffInventory";
import StaffNotifications from "./pages/staff/StaffNotifications";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffProfile from "./pages/staff/StaffProfile";

/* ============================================================
   CUSTOMER PAGES
============================================================ */

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders_temp";
import OrderDetails from "./pages/customer/OrderDetails";
import Payment from "./pages/customer/Payment";
import Notifications from "./pages/customer/Notifications";
import Profile from "./pages/customer/Profile";

/* ============================================================
   AUTH PAGES
============================================================ */

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

/* ============================================================
   OTHER PAGES / COMPONENTS
============================================================ */

import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Cookies from "./pages/Cookies";

import { CartProvider } from "./context/CartContext";

import SplashScreen from "./components/SplashScreen";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* ============================================================
   CUSTOMER LAYOUT
============================================================ */

function CustomerLayout() {
  return (
    <>
      <Navbar role="customer" />
      <Outlet />
      <Footer />
    </>
  );
}

/* ============================================================
   ADMIN LAYOUT
============================================================ */

function AdminLayout() {
  return (
    <>
      <Navbar role="admin" />
      <Outlet />
      <Footer />
    </>
  );
}

/* ============================================================
   STAFF LAYOUT
============================================================ */

function StaffLayout() {
  return (
    <>
      <Navbar role="staff" />
      <Outlet />
      <Footer />
    </>
  );
}

/* ============================================================
   APP
============================================================ */

function App() {
  const [stage, setStage] = useState<
    "splash" | "fading" | "done"
  >("splash");

  /* ==========================================================
     SPLASH SCREEN
  ========================================================== */

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setStage("fading");
    }, 2400);

    const doneTimer = window.setTimeout(() => {
      setStage("done");
    }, 3000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  /* ==========================================================
     SHOW SPLASH
  ========================================================== */

  if (stage !== "done") {
    return (
      <SplashScreen
        fading={stage === "fading"}
      />
    );
  }

  /* ==========================================================
     APPLICATION
  ========================================================== */

  return (
    <div className="app-enter">
      <CartProvider>
        <Routes>

          {/* ==================================================
              AUTH ROUTES
          ================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* ==================================================
              CUSTOMER ROUTES
          ================================================== */}

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

          {/* ==================================================
              ADMIN ROUTES
          ================================================== */}

          <Route element={<AdminLayout />}>

            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            {/* ADMIN PROFILE */}
            <Route
              path="/admin/profile"
              element={<AdminProfile />}
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

            <Route
              path="/admin/categories"
              element={<AdminCategories />}
            />

            <Route
              path="/admin/activity"
              element={<AdminActivity />}
            />

          </Route>

          {/* ==================================================
              STAFF ROUTES
          ================================================== */}

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

            <Route
              path="/staff/profile"
              element={<StaffProfile />}
            />

          </Route>

          {/* ==================================================
              INFO PAGES
          ================================================== */}

<Route
  path="/faq"
  element={<FAQ />}
/>

<Route
  path="/privacy-policy"
  element={<PrivacyPolicy />}
/>

<Route
  path="/cookies"
  element={<Cookies />}
/>

          {/* ==================================================
              DEFAULT
          ================================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          {/* ==================================================
              UNKNOWN ROUTES
          ================================================== */}

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