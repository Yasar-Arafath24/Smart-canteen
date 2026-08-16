import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";

/* ============================================================
   CHART COLORS
============================================================ */

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Confirmed: "#3b82f6",
  Completed: "#10b981",
  Cancelled: "#ef4444",
};

const INVENTORY_COLORS: Record<string, string> = {
  "In Stock": "#10b981",
  "Low Stock": "#f59e0b",
  "Out of Stock": "#ef4444",
};

/* ============================================================
   TYPES
============================================================ */

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  user_id: number;
  status: string;
  total: number;
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
}

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

type RangeOption = "7" | "30" | "90" | "all";

/* ============================================================
   API
============================================================ */

async function loadAnalyticsData() {
  const [ordersResponse, menuResponse] =
    await Promise.all([
      api.get<Order[]>("/orders/"),
      api.get<MenuItem[]>("/menu/"),
    ]);

  return {
    orders: Array.isArray(ordersResponse.data)
      ? ordersResponse.data
      : [],
    menuItems: Array.isArray(menuResponse.data)
      ? menuResponse.data
      : [],
  };
}

/* ============================================================
   HELPERS
============================================================ */

function currency(value: number) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function getStartDate(range: RangeOption) {
  if (range === "all") {
    return null;
  }

  const date = new Date();

  date.setHours(0, 0, 0, 0);

  date.setDate(
    date.getDate() - Number(range) + 1,
  );

  return date;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function displayDateTime(value: string) {
  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

/* ============================================================
   ADMIN ANALYTICS
============================================================ */

export default function AdminAnalytics() {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [range, setRange] =
    useState<RangeOption>("30");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadData = useCallback(
    async (
      initialLoad = false,
    ) => {
      try {
        if (initialLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const data =
          await loadAnalyticsData();

        setOrders(data.orders);
        setMenuItems(data.menuItems);

        setLastUpdated(new Date());
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Unable to load analytics.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /* ==========================================================
     ADMIN REALTIME WEBSOCKET
  ========================================================== */

  function connectAdminRealtime() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      return null;
    }

    const apiBase =
      import.meta.env.VITE_API_URL ??
      "http://localhost:8000/api/v1";

    const host = apiBase.replace(
      /^https?:\/\//,
      "",
    );

    const protocol =
      apiBase.startsWith("https:")
        ? "wss:"
        : "ws:";

    const socket = new WebSocket(
      `${protocol}//${host}/ws/admin`,
    );

    socket.onopen = () => {
      console.log(
        "Admin realtime WebSocket connected",
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(
        event.data,
      );

      console.log(
        "Admin realtime event:",
        message,
      );

      loadData(false);
    };

    socket.onerror = (event) => {
      console.error(
        "Admin WebSocket error:",
        event,
      );
    };

    socket.onclose = () => {
      console.log(
        "Admin WebSocket disconnected",
      );
    };

    return socket;
  }

  useEffect(() => {
    const socket =
      connectAdminRealtime();

    return () => {
      socket?.close();
    };
  }, []);

  /* ==========================================================
     INITIAL LOAD + AUTO REFRESH
  ========================================================== */

  useEffect(() => {
    loadData(true);

    const interval = window.setInterval(
      () => {
        loadData(false);
      },
      5000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadData]);

  /* ==========================================================
     MANUAL REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadData(false);
    setSuccess(
      "Analytics refreshed successfully.",
    );

    window.setTimeout(() => {
      setSuccess("");
    }, 2500);
  }

  /* ==========================================================
     FILTERED ORDERS
  ========================================================== */

  const filteredOrders = useMemo(() => {
    const startDate =
      getStartDate(range);

    if (!startDate) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        new Date(order.created_at) >=
        startDate
      );
    });
  }, [orders, range]);

  /* ==========================================================
     REVENUE ORDERS
  ========================================================== */

  const revenueOrders =
    useMemo(
      () =>
        filteredOrders.filter(
          (order) =>
            order.status.toLowerCase() !==
            "cancelled",
        ),
      [filteredOrders],
    );

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const summary = useMemo(() => {
    const revenue =
      revenueOrders.reduce(
        (total, order) =>
          total + Number(order.total || 0),
        0,
      );

    const totalOrders =
      filteredOrders.length;

    const pending =
      filteredOrders.filter(
        (order) =>
          order.status.toLowerCase() ===
          "pending",
      ).length;

    const confirmed =
      filteredOrders.filter(
        (order) =>
          order.status.toLowerCase() ===
          "confirmed",
      ).length;

    const completed =
      filteredOrders.filter(
        (order) =>
          order.status.toLowerCase() ===
          "completed",
      ).length;

    const cancelled =
      filteredOrders.filter(
        (order) =>
          order.status.toLowerCase() ===
          "cancelled",
      ).length;

    const averageOrder =
      revenueOrders.length > 0
        ? revenue / revenueOrders.length
        : 0;

    const cancellationRate =
      totalOrders > 0
        ? (cancelled / totalOrders) * 100
        : 0;

    const totalUnits =
      revenueOrders.reduce(
        (total, order) =>
          total +
          order.items.reduce(
            (itemTotal, item) =>
              itemTotal + item.quantity,
            0,
          ),
        0,
      );

    return {
      revenue,
      totalOrders,
      pending,
      confirmed,
      completed,
      cancelled,
      averageOrder,
      cancellationRate,
      totalUnits,
    };
  }, [filteredOrders, revenueOrders]);

  /* ==========================================================
     1. REVENUE TREND
  ========================================================== */

  const revenueTrend = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        revenue: number;
        orders: number;
      }
    >();

    filteredOrders.forEach((order) => {
      const date =
        new Date(order.created_at);

      const key = dateKey(date);

      if (!map.has(key)) {
        map.set(key, {
          date: key,
          revenue: 0,
          orders: 0,
        });
      }

      const row = map.get(key)!;

      row.orders += 1;

      if (
        order.status.toLowerCase() !==
        "cancelled"
      ) {
        row.revenue += Number(
          order.total || 0,
        );
      }
    });

    return Array.from(map.values())
      .sort((a, b) =>
        a.date.localeCompare(b.date),
      )
      .map((row) => ({
        ...row,
        label: displayDate(row.date),
      }));
  }, [filteredOrders]);

  /* ==========================================================
     2. ORDER TREND
  ========================================================== */

  const ordersTrend = revenueTrend.map(
    (row) => ({
      label: row.label,
      orders: row.orders,
    }),
  );

  /* ==========================================================
     3. STATUS BREAKDOWN
  ========================================================== */

  const statusChart = [
    {
      name: "Pending",
      value: summary.pending,
    },
    {
      name: "Confirmed",
      value: summary.confirmed,
    },
    {
      name: "Completed",
      value: summary.completed,
    },
    {
      name: "Cancelled",
      value: summary.cancelled,
    },
  ];

  /* ==========================================================
     4. DAILY SALES
  ========================================================== */

  const dailySales = revenueTrend.map(
    (row) => ({
      label: row.label,
      sales: row.revenue,
    }),
  );

  /* ==========================================================
     5. WEEKLY SALES
  ========================================================== */

  const weeklySales = useMemo(() => {
    const map = new Map<
      string,
      number
    >();

    revenueOrders.forEach((order) => {
      const date =
        new Date(order.created_at);

      const day =
        date.getDay();

      const start =
        new Date(date);

      const difference =
        day === 0 ? 6 : day - 1;

      start.setDate(
        date.getDate() - difference,
      );

      start.setHours(0, 0, 0, 0);

      const key = dateKey(start);

      map.set(
        key,
        (map.get(key) || 0) +
          Number(order.total || 0),
      );
    });

    return Array.from(map.entries())
      .sort(([a], [b]) =>
        a.localeCompare(b),
      )
      .map(([key, revenue]) => ({
        label: displayDate(key),
        revenue,
      }));
  }, [revenueOrders]);

  /* ==========================================================
     6. MONTHLY SALES
  ========================================================== */

  const monthlySales = useMemo(() => {
    const map = new Map<
      string,
      number
    >();

    revenueOrders.forEach((order) => {
      const date =
        new Date(order.created_at);

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      map.set(
        key,
        (map.get(key) || 0) +
          Number(order.total || 0),
      );
    });

    return Array.from(map.entries())
      .sort(([a], [b]) =>
        a.localeCompare(b),
      )
      .map(([key, revenue]) => {
        const [year, month] =
          key.split("-");

        const label = new Date(
          Number(year),
          Number(month) - 1,
          1,
        ).toLocaleDateString(
          "en-IN",
          {
            month: "short",
            year: "numeric",
          },
        );

        return {
          label,
          revenue,
        };
      });
  }, [revenueOrders]);

  /* ==========================================================
     7. TOP MENU ITEMS BY QUANTITY
  ========================================================== */

  const topItems = useMemo(() => {
    const map = new Map<
      number,
      {
        menuItemId: number;
        quantity: number;
        revenue: number;
      }
    >();

    revenueOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing =
          map.get(item.menu_item_id);

        if (existing) {
          existing.quantity +=
            item.quantity;

          existing.revenue +=
            Number(item.price) *
            item.quantity;
        } else {
          map.set(
            item.menu_item_id,
            {
              menuItemId:
                item.menu_item_id,
              quantity: item.quantity,
              revenue:
                Number(item.price) *
                item.quantity,
            },
          );
        }
      });
    });

    return Array.from(map.values())
      .sort(
        (a, b) =>
          b.quantity - a.quantity,
      )
      .slice(0, 10)
      .map((item) => {
        const menu =
          menuItems.find(
            (menuItem) =>
              menuItem.id ===
              item.menuItemId,
          );

        return {
          ...item,
          name:
            menu?.name ||
            `Menu Item #${item.menuItemId}`,
        };
      });
  }, [revenueOrders, menuItems]);

  /* ==========================================================
     8. ITEM REVENUE
  ========================================================== */

  const itemRevenue =
    [...topItems]
      .sort(
        (a, b) =>
          b.revenue - a.revenue,
      )
      .map((item) => ({
        name: item.name,
        revenue: item.revenue,
      }));

  /* ==========================================================
     9. CUSTOMER ORDERS
  ========================================================== */

  const customerOrders =
    useMemo(() => {
      const map = new Map<
        number,
        number
      >();

      filteredOrders.forEach(
        (order) => {
          map.set(
            order.user_id,
            (map.get(order.user_id) ||
              0) + 1,
          );
        },
      );

      return Array.from(map.entries())
        .sort(
          ([, a], [, b]) =>
            b - a,
        )
        .slice(0, 10)
        .map(
          ([userId, orders]) => ({
            customer:
              `User #${userId}`,
            orders,
          }),
        );
    }, [filteredOrders]);

  /* ==========================================================
     10. AVERAGE ORDER VALUE
  ========================================================== */

  const averageOrderTrend =
    useMemo(() => {
      return revenueTrend.map(
        (row) => ({
          label: row.label,
          average:
            row.orders > 0
              ? row.revenue /
                Math.max(
                  row.orders,
                  1,
                )
              : 0,
        }),
      );
    }, [revenueTrend]);

  /* ==========================================================
     11. CANCELLATION RATE
  ========================================================== */

  const cancellationTrend =
    useMemo(() => {
      return revenueTrend.map(
        (row) => {
          const cancelled =
            filteredOrders.filter(
              (order) => {
                const key =
                  dateKey(
                    new Date(
                      order.created_at,
                    ),
                  );

                return (
                  key ===
                    row.date &&
                  order.status.toLowerCase() ===
                    "cancelled"
                );
              },
            ).length;

          const rate =
            row.orders > 0
              ? (cancelled /
                  row.orders) *
                100
              : 0;

          return {
            label: row.label,
            rate:
              Number(rate.toFixed(2)),
          };
        },
      );
    }, [revenueTrend, filteredOrders]);

  /* ==========================================================
     12. INVENTORY STATUS
  ========================================================== */

  const inventoryStatus = useMemo(() => {
    const inStock =
      menuItems.filter(
        (item) => item.stock > 5,
      ).length;

    const lowStock =
      menuItems.filter(
        (item) =>
          item.stock > 0 &&
          item.stock <= 5,
      ).length;

    const outOfStock =
      menuItems.filter(
        (item) => item.stock <= 0,
      ).length;

    return [
      {
        name: "In Stock",
        value: inStock,
      },
      {
        name: "Low Stock",
        value: lowStock,
      },
      {
        name: "Out of Stock",
        value: outOfStock,
      },
    ];
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

          Loading real-time analytics...

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

      <header className="border-b border-gray-100 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
            >
              <ArrowLeft size={18} />
            </button>

            <div>

              <div className="flex items-center gap-3">

                <p className="text-sm font-medium text-[#32145f]">
                  Administration
                </p>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  LIVE
                </span>

              </div>

              <h1 className="mt-1 text-2xl font-bold text-[#24113f]">
                Real-Time Analytics
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Automatically refreshed every 5 seconds.
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            {lastUpdated && (
              <span className="hidden text-xs text-gray-400 md:block">
                Updated{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-IN",
                )}
              </span>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f] disabled:opacity-50"
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh

            </button>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            TITLE / RANGE
        ==================================================== */}

        <section className="mb-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-sm font-medium text-[#32145f]">
                Business Intelligence
              </p>

              <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
                Canteen Performance
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                12 live views of your orders, revenue, customers, and inventory.
              </p>

            </div>

            <select
              value={range}
              onChange={(event) =>
                setRange(
                  event.target
                    .value as RangeOption,
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-50"
            >

              <option value="7">
                Last 7 Days
              </option>

              <option value="30">
                Last 30 Days
              </option>

              <option value="90">
                Last 90 Days
              </option>

              <option value="all">
                All Time
              </option>

            </select>

          </div>

        </section>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={20}
              className="shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Analytics Error
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={18} />
            </button>

          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        {/* ====================================================
            KPI CARDS
        ==================================================== */}

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <KpiCard
            label="Revenue"
            value={currency(
              summary.revenue,
            )}
            icon={
              <TrendingUp size={21} />
            }
          />

          <KpiCard
            label="Orders"
            value={summary.totalOrders}
            icon={
              <Package size={21} />
            }
          />

          <KpiCard
            label="Average Order"
            value={currency(
              summary.averageOrder,
            )}
            icon={
              <BarChart3 size={21} />
            }
          />

          <KpiCard
            label="Items Sold"
            value={summary.totalUnits}
            icon={
              <CheckCircle2 size={21} />
            }
          />

        </section>

        {/* ====================================================
            STATUS KPI
        ==================================================== */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <KpiCard
            label="Pending"
            value={summary.pending}
            icon={<Clock3 size={21} />}
            className="text-yellow-700"
          />

          <KpiCard
            label="Confirmed"
            value={summary.confirmed}
            icon={
              <CheckCircle2 size={21} />
            }
            className="text-blue-700"
          />

          <KpiCard
            label="Completed"
            value={summary.completed}
            icon={
              <CheckCircle2 size={21} />
            }
            className="text-green-700"
          />

          <KpiCard
            label="Cancellation Rate"
            value={`${summary.cancellationRate.toFixed(
              1,
            )}%`}
            icon={
              <XCircle size={21} />
            }
            className="text-red-600"
          />

        </section>

        {/* ====================================================
            GRAPH 1 - REVENUE TREND
        ==================================================== */}

        <ChartCard
          title="1. Revenue Trend"
          description="Revenue from non-cancelled orders."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={revenueTrend}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#32145f"
                strokeWidth={3}
                dot={{ r: 3 }}
              />

            </LineChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 2 - ORDERS TREND
        ==================================================== */}

        <ChartCard
          title="2. Orders Trend"
          description="Orders created over time."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={ordersTrend}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="orders"
                name="Orders"
                fill="#32145f"
              />

            </BarChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 3 - STATUS
        ==================================================== */}

        <ChartCard
          title="3. Order Status Breakdown"
          description="Current status distribution."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={statusChart}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label
              >
                {statusChart.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      STATUS_COLORS[entry.name] ??
                      "#32145f"
                    }
                  />
                ))}
              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 4 - DAILY SALES
        ==================================================== */}

        <ChartCard
          title="4. Daily Sales"
          description="Daily revenue performance."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={dailySales}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="sales"
                name="Sales"
                fill="#32145f"
              />

            </BarChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 5 - WEEKLY SALES
        ==================================================== */}

        <ChartCard
          title="5. Weekly Sales"
          description="Revenue grouped by week."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={weeklySales}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Weekly Revenue"
                stroke="#32145f"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 6 - MONTHLY SALES
        ==================================================== */}

        <ChartCard
          title="6. Monthly Sales"
          description="Monthly revenue comparison."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={monthlySales}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#32145f"
              />

            </BarChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 7 - TOP MENU ITEMS
        ==================================================== */}

        <ChartCard
          title="7. Most Ordered Menu Items"
          description="Top foods by quantity sold."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={topItems}
              layout="vertical"
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
              />

              <YAxis
                type="category"
                dataKey="name"
                width={140}
              />

              <Tooltip />

              <Bar
                dataKey="quantity"
                name="Quantity Sold"
                fill="#32145f"
              />

            </BarChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 8 - ITEM REVENUE
        ==================================================== */}

        <ChartCard
          title="8. Revenue by Menu Item"
          description="Items generating the most revenue."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={itemRevenue}
              layout="vertical"
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
              />

              <YAxis
                type="category"
                dataKey="name"
                width={140}
              />

              <Tooltip />

              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#32145f"
              />

            </BarChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 9 - CUSTOMER ORDERS
        ==================================================== */}

        <ChartCard
          title="9. Orders by Customer"
          description="Customers with the highest order counts."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={customerOrders}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="customer"
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Bar
                dataKey="orders"
                name="Orders"
                fill="#32145f"
              />

            </BarChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 10 - AVERAGE ORDER VALUE
        ==================================================== */}

        <ChartCard
          title="10. Average Order Value"
          description="Average revenue per non-cancelled order."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={averageOrderTrend}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="average"
                name="Average Order"
                stroke="#32145f"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 11 - CANCELLATION RATE
        ==================================================== */}

        <ChartCard
          title="11. Cancellation Rate"
          description="Daily percentage of cancelled orders."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={cancellationTrend}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="rate"
                name="Cancellation %"
                stroke="#dc2626"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            GRAPH 12 - INVENTORY
        ============================================================ */}

        <ChartCard
          title="12. Inventory Status"
          description="Current menu stock distribution."
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={
                  inventoryStatus
                }
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label
              >
                {inventoryStatus.map(
                  (entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        INVENTORY_COLORS[
                          entry.name
                        ] ?? "#32145f"
                      }
                    />
                  ),
                )}
              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </ChartCard>

        {/* ====================================================
            LIVE INFORMATION
        ==================================================== */}

        <section className="mt-8 rounded-3xl border border-green-100 bg-green-50 p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                <h3 className="font-bold text-green-800">
                  Live Analytics Active
                </h3>

              </div>

              <p className="mt-2 text-sm text-green-700">
                Data is automatically refreshed every 5 seconds from the SmartCanteen API.
              </p>

              {lastUpdated && (
                <p className="mt-1 text-xs text-green-600">
                  Last update:{" "}
                  {displayDateTime(
                    lastUpdated.toISOString(),
                  )}
                </p>
              )}

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="flex items-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
            >

              <ArrowLeft size={17} />

              Admin Dashboard

            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  label,
  value,
  icon,
  className = "text-[#32145f]",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 ${className}`}
      >
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
   CHART CARD
============================================================ */

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

      <div className="mb-5">

        <h3 className="font-bold text-[#24113f]">
          {title}
        </h3>

        <p className="mt-1 text-sm text-gray-400">
          {description}
        </p>

      </div>

      <div className="h-[360px]">
        {children}
      </div>

    </section>
  );
}