import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Edit3,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  Users,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getAllOrders,
  getAllUsers,
  type AdminOrder,
  type AdminUser,
} from "../../api/admin";

import { api } from "../../api/client";

/* ============================================================
   TYPES
============================================================ */

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number;
  is_available: boolean;
  stock: number;
  created_at: string;
}

/* ============================================================
   MENU API
============================================================ */

async function getMenuItems(): Promise<MenuItem[]> {
  const response =
    await api.get<MenuItem[]>("/menu/");

  return response.data;
}

/* ============================================================
   ADMIN DASHBOARD
============================================================ */

export default function AdminDashboard() {
  const navigate = useNavigate();

  /* ==========================================================
     DATA
  ========================================================== */

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ==========================================================
     ALERTS
  ========================================================== */

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  async function loadDashboard(
    showLoading = true,
  ) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [
        ordersData,
        usersData,
        menuData,
      ] = await Promise.all([
        getAllOrders(),
        getAllUsers(),
        getMenuItems(),
      ]);

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : [],
      );

      setUsers(
        Array.isArray(usersData)
          ? usersData
          : [],
      );

      setMenuItems(
        Array.isArray(menuData)
          ? menuData
          : [],
      );
    } catch (err: any) {
      console.error(
        "Admin dashboard error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load admin dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadDashboard(false);
  }

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics = useMemo(() => {
    const pending =
      orders.filter(
        (order) =>
          order.status?.toLowerCase() ===
          "pending",
      ).length;

    const confirmed =
      orders.filter(
        (order) =>
          order.status?.toLowerCase() ===
          "confirmed",
      ).length;

    const completed =
      orders.filter(
        (order) =>
          order.status?.toLowerCase() ===
          "completed",
      ).length;

    const cancelled =
      orders.filter(
        (order) =>
          order.status?.toLowerCase() ===
          "cancelled",
      ).length;

    const revenue =
      orders
        .filter(
          (order) =>
            order.status?.toLowerCase() !==
            "cancelled",
        )
        .reduce(
          (total, order) =>
            total +
            Number(order.total || 0),
          0,
        );

    const availableMenuItems =
      menuItems.filter(
        (item) =>
          item.is_available,
      ).length;

    const unavailableMenuItems =
      menuItems.filter(
        (item) =>
          !item.is_available,
      ).length;

    const lowStockItems =
      menuItems.filter(
        (item) =>
          item.stock > 0 &&
          item.stock <= 5,
      ).length;

    const outOfStockItems =
      menuItems.filter(
        (item) =>
          item.stock === 0,
      ).length;

    return {
      totalOrders: orders.length,
      totalUsers: users.length,

      pending,
      confirmed,
      completed,
      cancelled,

      revenue,

      totalMenuItems:
        menuItems.length,
      availableMenuItems,
      unavailableMenuItems,
      lowStockItems,
      outOfStockItems,
    };
  }, [
    orders,
    users,
    menuItems,
  ]);

  /* ==========================================================
     RECENT ORDERS
  ========================================================== */

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.created_at,
            ).getTime() -
            new Date(
              a.created_at,
            ).getTime(),
        )
        .slice(0, 10);
    }, [orders]);

  /* ==========================================================
     LOW STOCK MENU ITEMS
  ========================================================== */

  const lowStockItems =
    useMemo(() => {
      return menuItems
        .filter(
          (item) =>
            item.stock <= 5,
        )
        .sort(
          (a, b) =>
            a.stock - b.stock,
        )
        .slice(0, 8);
    }, [menuItems]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">

        <div className="flex items-center gap-3 text-sm text-gray-400">

          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading admin dashboard...

        </div>

      </div>
    );
  }

  /* ==========================================================
     MAIN
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-5">

          <div>

            <p className="text-sm font-medium text-purple-200">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-purple-200">
              Manage your SmartCanteen system.
            </p>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>

      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Unable to load dashboard
              </p>

              <p className="mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadDashboard()
                }
                className="mt-3 font-semibold underline"
              >
                Try again
              </button>

            </div>

          </div>
        )}

        {/* ====================================================
            QUICK ADMIN ACTIONS
        ==================================================== */}

        <section className="mb-10">

          <div className="mb-5">

            <p className="text-sm text-gray-400">
              Administration
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Management
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Manage orders, inventory, menu items,
              customers, analytics, and system activity.
            </p>

          </div>


          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            <ManagementCard
              icon={
                <ClipboardList
                  size={22}
                />
              }
              title="Orders"
              description="Review and update customer orders."
              onClick={() =>
                navigate(
                  "/admin/orders",
                )
              }
            />

            <ManagementCard
              icon={
                <Package size={22} />
              }
              title="Inventory"
              description="Manage stock and low-stock items."
              onClick={() =>
                navigate(
                  "/admin/inventory",
                )
              }
            />

            <ManagementCard
              icon={
                <Store size={22} />
              }
              title="Menu"
              description="Add, edit, and manage food items."
              onClick={() =>
                navigate(
                  "/admin/menu",
                )
              }
            />

            <ManagementCard
              icon={
                <Users size={22} />
              }
              title="Customers"
              description="Manage registered users."
              onClick={() =>
                navigate(
                  "/admin/users",
                )
              }
            />

            <ManagementCard
              icon={
                <BarChart3
                  size={22}
                />
              }
              title="Analytics"
              description="View sales and order analytics."
              onClick={() =>
                navigate(
                  "/admin/analytics",
                )
              }
            />

            <ManagementCard
              icon={
                <Activity
                  size={22}
                />
              }
              title="Activity"
              description="View system activity and audit logs."
              onClick={() =>
                navigate(
                  "/admin/activity",
                )
              }
            />

          </div>

        </section>

        {/* ====================================================
            MAIN STATISTICS
        ==================================================== */}

        <section>

          <div className="mb-5">

            <p className="text-sm text-gray-400">
              Overview
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Canteen Statistics
            </h2>

          </div>


          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              icon={
                <ShoppingBag
                  size={21}
                />
              }
              label="Total Orders"
              value={
                statistics.totalOrders
              }
            />

            <StatCard
              icon={
                <Users size={21} />
              }
              label="Customers"
              value={
                statistics.totalUsers
              }
            />

            <StatCard
              icon={
                <Clock3 size={21} />
              }
              label="Pending Orders"
              value={
                statistics.pending
              }
            />

            <StatCard
              icon={
                <Package size={21} />
              }
              label="Revenue"
              value={`₹${statistics.revenue.toFixed(
                2,
              )}`}
            />

          </div>

        </section>

        {/* ====================================================
            MENU OVERVIEW
        ==================================================== */}

        <section className="mt-10">

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-sm text-gray-400">
                Menu & Inventory
              </p>

              <h2 className="text-xl font-bold text-[#24113f]">
                Menu Overview
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Current menu availability and stock.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/menu",
                )
              }
              className="flex items-center gap-2 self-start rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100"
            >
              Manage Menu
              <ArrowRight size={16} />
            </button>

          </div>


          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              icon={
                <Store size={21} />
              }
              label="Total Menu Items"
              value={
                statistics.totalMenuItems
              }
            />

            <StatCard
              icon={
                <CheckCircle2
                  size={21}
                />
              }
              label="Available Items"
              value={
                statistics.availableMenuItems
              }
            />

            <StatCard
              icon={
                <Clock3 size={21} />
              }
              label="Low Stock"
              value={
                statistics.lowStockItems
              }
            />

            <StatCard
              icon={
                <XCircle size={21} />
              }
              label="Out of Stock"
              value={
                statistics.outOfStockItems
              }
            />

          </div>

        </section>

        {/* ====================================================
            ORDER STATUS
        ==================================================== */}

        <section className="mt-10">

          <div className="mb-5">

            <p className="text-sm text-gray-400">
              Order Status
            </p>

            <h2 className="text-xl font-bold text-[#24113f]">
              Current Orders
            </h2>

          </div>


          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatusCard
              label="Pending"
              value={
                statistics.pending
              }
              icon={
                <Clock3 size={20} />
              }
              className="bg-yellow-50 text-yellow-700"
            />

            <StatusCard
              label="Confirmed"
              value={
                statistics.confirmed
              }
              icon={
                <CheckCircle2
                  size={20}
                />
              }
              className="bg-purple-50 text-[#32145f]"
            />

            <StatusCard
              label="Completed"
              value={
                statistics.completed
              }
              icon={
                <CheckCircle2
                  size={20}
                />
              }
              className="bg-green-50 text-green-700"
            />

            <StatusCard
              label="Cancelled"
              value={
                statistics.cancelled
              }
              icon={
                <XCircle size={20} />
              }
              className="bg-red-50 text-red-600"
            />

          </div>

        </section>

        {/* ====================================================
            LOW STOCK
        ==================================================== */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-bold text-[#24113f]">
                Low Stock Items
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Items that may need restocking.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/menu",
                )
              }
              className="flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
            >
              Manage Stock
              <ArrowRight size={16} />
            </button>

          </div>


          {lowStockItems.length ===
          0 ? (

            <div className="p-10 text-center">

              <CheckCircle2
                size={40}
                className="mx-auto text-green-500"
              />

              <p className="mt-4 font-semibold text-[#24113f]">
                Stock looks good
              </p>

              <p className="mt-1 text-sm text-gray-400">
                No items currently have low stock.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {lowStockItems.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-center gap-4">

                      {item.image_url ? (
                        <img
                          src={
                            item.image_url
                          }
                          alt={item.name}
                          className="h-12 w-12 rounded-xl object-cover"
                          onError={(
                            event,
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                          <Store
                            size={20}
                          />
                        </div>
                      )}

                      <div>

                        <p className="font-semibold text-[#24113f]">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Category #
                          {
                            item.category_id
                          }
                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-4">

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          item.stock ===
                          0
                            ? "bg-red-50 text-red-600"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {item.stock ===
                        0
                          ? "Out of stock"
                          : `${item.stock} left`}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/admin/menu",
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-purple-100 hover:bg-purple-50 hover:text-[#32145f]"
                        title="Manage menu"
                      >
                        <Edit3
                          size={16}
                        />
                      </button>

                    </div>

                  </div>
                ),
              )}

            </div>

          )}

        </section>

        {/* ====================================================
            RECENT ORDERS
        ==================================================== */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="font-bold text-[#24113f]">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Latest orders from all customers
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/orders",
                )
              }
              className="flex items-center justify-center gap-2 self-start rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100"
            >
              View All Orders
              <ArrowRight size={16} />
            </button>

          </div>


          {recentOrders.length ===
          0 ? (

            <div className="p-12 text-center">

              <Package
                size={42}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 text-sm text-gray-400">
                No orders found.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Items
                    </th>

                    <th className="px-6 py-4">
                      Total
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {recentOrders.map(
                    (order) => {

                      const customer =
                        users.find(
                          (user) =>
                            user.id ===
                            order.user_id,
                        );

                      const itemCount =
                        order.items?.reduce(
                          (
                            sum,
                            item,
                          ) =>
                            sum +
                            item.quantity,
                          0,
                        ) ?? 0;

                      return (
                        <tr
                          key={order.id}
                          className="transition hover:bg-gray-50"
                        >

                          <td className="px-6 py-5">

                            <span className="font-semibold text-[#24113f]">
                              #{order.id}
                            </span>

                          </td>

                          <td className="px-6 py-5">

                            <div>

                              <p className="font-medium text-[#24113f]">
                                {customer?.name ||
                                  `User #${order.user_id}`}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {customer?.email ||
                                  "—"}
                              </p>

                            </div>

                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500">
                            {itemCount}
                          </td>

                          <td className="px-6 py-5 font-semibold text-[#32145f]">
                            ₹
                            {Number(
                              order.total ||
                                0,
                            ).toFixed(
                              2,
                            )}
                          </td>

                          <td className="px-6 py-5">

                            <OrderStatus
                              status={
                                order.status
                              }
                            />

                          </td>

                          <td className="px-6 py-5 text-sm text-gray-400">
                            {new Date(
                              order.created_at,
                            ).toLocaleDateString()}
                          </td>

                        </tr>
                      );
                    },
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ====================================================
            CUSTOMERS
        ==================================================== */}

        <section className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-bold text-[#24113f]">
                  Customers
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Registered users
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">

                <Users
                  size={19}
                />

              </div>

            </div>

          </div>


          {users.length ===
          0 ? (

            <div className="p-10 text-center text-sm text-gray-400">
              No users found.
            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {users
                .slice(0, 10)
                .map((user) => (

                  <div
                    key={user.id}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="font-semibold text-[#24113f]">
                        {user.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {user.email}
                      </p>

                    </div>

                    <div className="flex items-center gap-3">

                      <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold capitalize text-[#32145f]">
                        {user.role}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {user.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </div>

                  </div>

                ))}

            </div>

          )}


          {users.length >
            10 && (
            <div className="border-t border-gray-100 p-5 text-center">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/users",
                  )
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#32145f] hover:underline"
              >
                View All Customers
                <ArrowRight
                  size={16}
                />
              </button>

            </div>
          )}

        </section>

        {/* ====================================================
            MENU QUICK LINK
        ==================================================== */}

        <section className="mt-10 rounded-3xl border border-purple-100 bg-purple-50 p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#32145f] shadow-sm">

                <Store
                  size={23}
                />

              </div>

              <div>

                <h2 className="font-bold text-[#24113f]">
                  Menu Management
                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  {statistics.totalMenuItems}{" "}
                  menu{" "}
                  {statistics.totalMenuItems ===
                  1
                    ? "item"
                    : "items"}{" "}
                  •{" "}
                  {statistics.availableMenuItems}{" "}
                  available •{" "}
                  {statistics.outOfStockItems}{" "}
                  out of stock

                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/menu",
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >
              Open Menu Management
              <ArrowRight
                size={17}
              />
            </button>

          </div>

        </section>

        {/* ====================================================
            ACTIVITY QUICK LINK
        ==================================================== */}

        <section className="mt-8 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">

                <Activity
                  size={23}
                />

              </div>

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  System Monitoring
                </p>

                <h2 className="mt-1 font-bold text-[#24113f]">
                  Activity & Audit Logs
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review orders, inventory, staff, attendance, and user activity.
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/activity",
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >
              Open Activity
              <ArrowRight
                size={17}
              />
            </button>

          </div>

        </section>

        {/* ====================================================
            BACK TO CUSTOMER DASHBOARD
        ==================================================== */}

        <div className="mt-10">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard",
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
          >
            Back to Customer Dashboard
          </button>

        </div>

      </main>

    </div>
  );
}

/* ============================================================
   MANAGEMENT CARD
============================================================ */

function ManagementCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-purple-100 hover:shadow-md"
    >

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#32145f]"
        />

      </div>

      <h3 className="mt-5 font-bold text-[#24113f]">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-gray-400">
        {description}
      </p>

    </button>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
        {icon}
      </div>

      <p className="mt-5 text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-[#24113f]">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   STATUS CARD
============================================================ */

function StatusCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-transparent p-5 ${className}`}
    >

      <div className="flex items-center justify-between">

        <span className="text-sm font-semibold">
          {label}
        </span>

        {icon}

      </div>

      <p className="mt-4 text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   ORDER STATUS
============================================================ */

function OrderStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    status?.toLowerCase() ||
    "unknown";

  const styles: Record<
    string,
    string
  > = {
    pending:
      "bg-yellow-50 text-yellow-700 border-yellow-100",

    confirmed:
      "bg-purple-50 text-[#32145f] border-purple-100",

    completed:
      "bg-green-50 text-green-700 border-green-100",

    cancelled:
      "bg-red-50 text-red-600 border-red-100",
  };

  const labels: Record<
    string,
    string
  > = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[normalized] ||
        "border-gray-100 bg-gray-50 text-gray-500"
      }`}
    >
      {labels[normalized] ||
        status}
    </span>
  );
}