import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";


/* ============================================================
   AUTH
============================================================ */

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";


/* ============================================================
   CUSTOMER
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
   ADMIN
============================================================ */

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminStaffAttendance from "./pages/admin/AdminStaffAttendance";
import AdminActivity from "./pages/admin/AdminActivity";


/* ============================================================
   STAFF
============================================================ */

import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrders from "./pages/staff/StaffOrders";
import StaffInventory from "./pages/staff/StaffInventory";
import StaffNotifications from "./pages/staff/StaffNotifications";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffProfile from "./pages/staff/StaffProfile";


/* ============================================================
   SHARED
============================================================ */

import { CartProvider } from "./context/CartContext";
import SplashScreen from "./components/SplashScreen";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import InfoPage from "./pages/InfoPage";


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
    const fadeTimer =
      window.setTimeout(() => {
        setStage("fading");
      }, 2400);

    const doneTimer =
      window.setTimeout(() => {
        setStage("done");
      }, 3000);

    return () => {
      window.clearTimeout(
        fadeTimer,
      );

      window.clearTimeout(
        doneTimer,
      );
    };
  }, []);


  /* ==========================================================
     SHOW SPLASH
  ========================================================== */

  if (stage !== "done") {
    return (
      <SplashScreen
        fading={
          stage === "fading"
        }
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
              AUTH
          ================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* ==================================================
              CUSTOMER
          ================================================== */}

          <Route
            element={
              <CustomerLayout />
            }
          >

            <Route
              path="/dashboard"
              element={
                <CustomerDashboard />
              }
            />

            <Route
              path="/cart"
              element={<Cart />}
            />

            <Route
              path="/checkout"
              element={
                <Checkout />
              }
            />

            <Route
              path="/payment"
              element={
                <Payment />
              }
            />

            <Route
              path="/notifications"
              element={
                <Notifications />
              }
            />

            <Route
              path="/profile"
              element={
                <Profile />
              }
            />

            <Route
              path="/orders"
              element={
                <Orders />
              }
            />

            <Route
              path="/orders/:orderId"
              element={
                <OrderDetails />
              }
            />

          </Route>


          {/* ==================================================
              ADMIN
          ================================================== */}

          <Route
            element={
              <AdminLayout />
            }
          >

            {/* Dashboard */}

            <Route
              path="/admin"
              element={
                <AdminDashboard />
              }
            />


            {/* Orders */}

            <Route
              path="/admin/orders"
              element={
                <AdminOrders />
              }
            />


            {/* Users */}

            <Route
              path="/admin/users"
              element={
                <AdminUsers />
              }
            />


            {/* Inventory */}

            <Route
              path="/admin/inventory"
              element={
                <AdminInventory />
              }
            />


            {/* Menu */}

            <Route
              path="/admin/menu"
              element={
                <AdminMenu />
              }
            />


            {/* Categories */}

            <Route
              path="/admin/categories"
              element={
                <AdminCategories />
              }
            />


            {/* Analytics */}

            <Route
              path="/admin/analytics"
              element={
                <AdminAnalytics />
              }
            />


            {/* Staff Attendance */}

            <Route
              path="/admin/staff-attendance"
              element={
                <AdminStaffAttendance />
              }
            />


            {/* Activity / Audit Logs */}

            <Route
              path="/admin/activity"
              element={
                <AdminActivity />
              }
            />

          </Route>


          {/* ==================================================
              STAFF
          ================================================== */}

          <Route
            element={
              <StaffLayout />
            }
          >

            {/* Dashboard */}

            <Route
              path="/staff"
              element={
                <StaffDashboard />
              }
            />


            {/* Orders */}

            <Route
              path="/staff/orders"
              element={
                <StaffOrders />
              }
            />


            {/* Inventory */}

            <Route
              path="/staff/inventory"
              element={
                <StaffInventory />
              }
            />


            {/* Notifications */}

            <Route
              path="/staff/notifications"
              element={
                <StaffNotifications />
              }
            />


            {/* Attendance */}

            <Route
              path="/staff/attendance"
              element={
                <StaffAttendance />
              }
            />


            {/* Profile */}

            <Route
              path="/staff/profile"
              element={
                <StaffProfile />
              }
            />

          </Route>


          {/* ==================================================
              INFO PAGES
          ================================================== */}

          <Route
            path="/faq"
            element={
              <InfoPage
                title="FAQ"
                description="Frequently asked questions"
              />
            }
          />

          <Route
            path="/privacy-policy"
            element={
              <InfoPage
                title="Privacy Policy"
                description="How we handle your data"
              />
            }
          />

          <Route
            path="/cookies"
            element={
              <InfoPage
                title="Cookies"
                description="How we use cookies"
              />
            }
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