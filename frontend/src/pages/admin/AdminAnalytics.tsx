import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  LineChart as LineChartIcon,
  Loader2,
  Package,
  PieChart as PieChartIcon,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
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
   COLORS
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

type RangeOption =
  | "7"
  | "30"
  | "90"
  | "all";

type ChartKey =
  | "revenue"
  | "orders"
  | "status"
  | "daily-sales"
  | "weekly-sales"
  | "monthly-sales"
  | "top-items"
  | "item-revenue"
  | "customers"
  | "average-order"
  | "cancellation"
  | "inventory";


interface ChartOption {
  key: ChartKey;
  title: string;
  description: string;
  icon: React.ReactNode;
}


/* ============================================================
   CHART OPTIONS
============================================================ */

const CHART_OPTIONS: ChartOption[] = [
  {
    key: "revenue",
    title: "Revenue Trend",
    description:
      "Revenue from non-cancelled orders.",
    icon: <TrendingUp size={17} />,
  },
  {
    key: "orders",
    title: "Orders Trend",
    description:
      "Orders created over time.",
    icon: <ShoppingBag size={17} />,
  },
  {
    key: "status",
    title: "Order Status",
    description:
      "Current order status distribution.",
    icon: <Activity size={17} />,
  },
  {
    key: "daily-sales",
    title: "Daily Sales",
    description:
      "Daily revenue performance.",
    icon: <BarChart3 size={17} />,
  },
  {
    key: "weekly-sales",
    title: "Weekly Sales",
    description:
      "Revenue grouped by week.",
    icon: <LineChartIcon size={17} />,
  },
  {
    key: "monthly-sales",
    title: "Monthly Sales",
    description:
      "Monthly revenue comparison.",
    icon: <BarChart3 size={17} />,
  },
  {
    key: "top-items",
    title: "Top Menu Items",
    description:
      "Most ordered foods by quantity.",
    icon: <ShoppingBag size={17} />,
  },
  {
    key: "item-revenue",
    title: "Revenue by Item",
    description:
      "Menu items generating the most revenue.",
    icon: <TrendingUp size={17} />,
  },
  {
    key: "customers",
    title: "Orders by Customer",
    description:
      "Customers with the highest order counts.",
    icon: <Users size={17} />,
  },
  {
    key: "average-order",
    title: "Average Order Value",
    description:
      "Average revenue per non-cancelled order.",
    icon: <BarChart3 size={17} />,
  },
  {
    key: "cancellation",
    title: "Cancellation Rate",
    description:
      "Daily percentage of cancelled orders.",
    icon: <XCircle size={17} />,
  },
  {
    key: "inventory",
    title: "Inventory Status",
    description:
      "Current menu stock distribution.",
    icon: <Package size={17} />,
  },
];


/* ============================================================
   API
============================================================ */

async function loadAnalyticsData() {
  const [
    ordersResponse,
    menuResponse,
  ] = await Promise.all([
    api.get<Order[]>("/orders/"),
    api.get<MenuItem[]>("/menu/"),
  ]);

  return {
    orders: Array.isArray(
      ordersResponse.data,
    )
      ? ordersResponse.data
      : [],

    menuItems: Array.isArray(
      menuResponse.data,
    )
      ? menuResponse.data
      : [],
  };
}


/* ============================================================
   HELPERS
============================================================ */

function currency(value: number) {
  return `₹${Number(
    value || 0,
  ).toFixed(2)}`;
}

function getStartDate(
  range: RangeOption,
) {
  if (range === "all") {
    return null;
  }

  const date = new Date();

  date.setHours(
    0,
    0,
    0,
    0,
  );

  date.setDate(
    date.getDate() -
      Number(range) +
      1,
  );

  return date;
}

function dateKey(date: Date) {
  return date
    .toISOString()
    .slice(0, 10);
}

function displayDate(
  value: string,
) {
  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
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

  const [selectedChart, setSelectedChart] =
    useState<ChartKey>("revenue");

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

        setLastUpdated(
          new Date(),
        );
      } catch (err: any) {
        console.error(
          "Analytics error:",
          err,
        );

        setError(
          err?.response?.data
            ?.detail ||
            err?.response?.data
              ?.message ||
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
     WEBSOCKET
  ========================================================== */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "access_token",
      );

    if (!token) {
      return;
    }

    const apiBase =
      import.meta.env
        .VITE_API_URL ??
      "http://localhost:8000/api/v1";

    const protocol =
      apiBase.startsWith(
        "https:",
      )
        ? "wss:"
        : "ws:";

    const host =
      apiBase.replace(
        /^https?:\/\//,
        "",
      );

    const socket =
      new WebSocket(
        `${protocol}//${host}/ws/admin`,
      );

    socket.onopen = () => {
      console.log(
        "Analytics WebSocket connected",
      );
    };

    socket.onmessage = () => {
      loadData(false);
    };

    socket.onerror = (
      event,
    ) => {
      console.error(
        "Analytics WebSocket error:",
        event,
      );
    };

    socket.onclose = () => {
      console.log(
        "Analytics WebSocket disconnected",
      );
    };

    return () => {
      socket.close();
    };
  }, [loadData]);


  /* ==========================================================
     INITIAL LOAD + AUTO REFRESH
  ========================================================== */

  useEffect(() => {
    loadData(true);

    const interval =
      window.setInterval(
        () => {
          loadData(false);
        },
        5000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
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

  const filteredOrders =
    useMemo(() => {
      const startDate =
        getStartDate(range);

      if (!startDate) {
        return orders;
      }

      return orders.filter(
        (order) =>
          new Date(
            order.created_at,
          ) >= startDate,
      );
    }, [
      orders,
      range,
    ]);


  /* ==========================================================
     REVENUE ORDERS
  ========================================================== */

  const revenueOrders =
    useMemo(
      () =>
        filteredOrders.filter(
          (order) =>
            order.status
              .toLowerCase() !==
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
        (
          total,
          order,
        ) =>
          total +
          Number(
            order.total || 0,
          ),
        0,
      );

    const totalOrders =
      filteredOrders.length;

    const pending =
      filteredOrders.filter(
        (order) =>
          order.status
            .toLowerCase() ===
          "pending",
      ).length;

    const confirmed =
      filteredOrders.filter(
        (order) =>
          order.status
            .toLowerCase() ===
          "confirmed",
      ).length;

    const completed =
      filteredOrders.filter(
        (order) =>
          order.status
            .toLowerCase() ===
          "completed",
      ).length;

    const cancelled =
      filteredOrders.filter(
        (order) =>
          order.status
            .toLowerCase() ===
          "cancelled",
      ).length;

    const averageOrder =
      revenueOrders.length > 0
        ? revenue /
          revenueOrders.length
        : 0;

    const cancellationRate =
      totalOrders > 0
        ? (cancelled /
            totalOrders) *
          100
        : 0;

    const totalUnits =
      revenueOrders.reduce(
        (
          total,
          order,
        ) =>
          total +
          order.items.reduce(
            (
              itemTotal,
              item,
            ) =>
              itemTotal +
              item.quantity,
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
  }, [
    filteredOrders,
    revenueOrders,
  ]);


  /* ==========================================================
     1. REVENUE TREND
  ========================================================== */

  const revenueTrend =
    useMemo(() => {
      const map = new Map<
        string,
        {
          date: string;
          revenue: number;
          orders: number;
        }
      >();

      filteredOrders.forEach(
        (order) => {
          const date =
            new Date(
              order.created_at,
            );

          const key =
            dateKey(date);

          if (!map.has(key)) {
            map.set(key, {
              date: key,
              revenue: 0,
              orders: 0,
            });
          }

          const row =
            map.get(key)!;

          row.orders += 1;

          if (
            order.status
              .toLowerCase() !==
            "cancelled"
          ) {
            row.revenue +=
              Number(
                order.total || 0,
              );
          }
        },
      );

      return Array.from(
        map.values(),
      )
        .sort((a, b) =>
          a.date.localeCompare(
            b.date,
          ),
        )
        .map((row) => ({
          ...row,
          label:
            displayDate(
              row.date,
            ),
        }));
    }, [filteredOrders]);


  /* ==========================================================
     2. ORDER TREND
  ========================================================== */

  const ordersTrend =
    revenueTrend.map(
      (row) => ({
        label: row.label,
        orders: row.orders,
      }),
    );


  /* ==========================================================
     3. STATUS
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

  const dailySales =
    revenueTrend.map(
      (row) => ({
        label: row.label,
        sales: row.revenue,
      }),
    );


  /* ==========================================================
     5. WEEKLY SALES
  ========================================================== */

  const weeklySales =
    useMemo(() => {
      const map =
        new Map<string, number>();

      revenueOrders.forEach(
        (order) => {
          const date =
            new Date(
              order.created_at,
            );

          const day =
            date.getDay();

          const start =
            new Date(date);

          const difference =
            day === 0
              ? 6
              : day - 1;

          start.setDate(
            date.getDate() -
              difference,
          );

          start.setHours(
            0,
            0,
            0,
            0,
          );

          const key =
            dateKey(start);

          map.set(
            key,
            (map.get(key) ||
              0) +
              Number(
                order.total || 0,
              ),
          );
        },
      );

      return Array.from(
        map.entries(),
      )
        .sort(([a], [b]) =>
          a.localeCompare(b),
        )
        .map(
          ([key, revenue]) => ({
            label:
              displayDate(
                key,
              ),
            revenue,
          }),
        );
    }, [revenueOrders]);


  /* ==========================================================
     6. MONTHLY SALES
  ========================================================== */

  const monthlySales =
    useMemo(() => {
      const map =
        new Map<string, number>();

      revenueOrders.forEach(
        (order) => {
          const date =
            new Date(
              order.created_at,
            );

          const key =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1,
            ).padStart(2, "0")}`;

          map.set(
            key,
            (map.get(key) ||
              0) +
              Number(
                order.total || 0,
              ),
          );
        },
      );

      return Array.from(
        map.entries(),
      )
        .sort(([a], [b]) =>
          a.localeCompare(b),
        )
        .map(
          ([key, revenue]) => {
            const [year, month] =
              key.split("-");

            const label =
              new Date(
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
          },
        );
    }, [revenueOrders]);


  /* ==========================================================
     7. TOP MENU ITEMS
  ========================================================== */

  const topItems =
    useMemo(() => {
      const map = new Map<
        number,
        {
          menuItemId: number;
          quantity: number;
          revenue: number;
        }
      >();

      revenueOrders.forEach(
        (order) => {
          order.items.forEach(
            (item) => {
              const existing =
                map.get(
                  item.menu_item_id,
                );

              if (existing) {
                existing.quantity +=
                  item.quantity;

                existing.revenue +=
                  Number(
                    item.price,
                  ) *
                  item.quantity;
              } else {
                map.set(
                  item.menu_item_id,
                  {
                    menuItemId:
                      item.menu_item_id,
                    quantity:
                      item.quantity,
                    revenue:
                      Number(
                        item.price,
                      ) *
                      item.quantity,
                  },
                );
              }
            },
          );
        },
      );

      return Array.from(
        map.values(),
      )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity,
        )
        .slice(0, 10)
        .map(
          (item) => {
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
          },
        );
    }, [
      revenueOrders,
      menuItems,
    ]);


  /* ==========================================================
     8. ITEM REVENUE
  ========================================================== */

  const itemRevenue =
    [...topItems]
      .sort(
        (a, b) =>
          b.revenue -
          a.revenue,
      )
      .map((item) => ({
        name: item.name,
        revenue:
          item.revenue,
      }));


  /* ==========================================================
     9. CUSTOMER ORDERS
  ========================================================== */

  const customerOrders =
    useMemo(() => {
      const map =
        new Map<number, number>();

      filteredOrders.forEach(
        (order) => {
          map.set(
            order.user_id,
            (map.get(
              order.user_id,
            ) || 0) + 1,
          );
        },
      );

      return Array.from(
        map.entries(),
      )
        .sort(
          ([, a], [, b]) =>
            b - a,
        )
        .slice(0, 10)
        .map(
          ([
            userId,
            orderCount,
          ]) => ({
            customer:
              `User #${userId}`,
            orders:
              orderCount,
          }),
        );
    }, [filteredOrders]);


  /* ==========================================================
     10. AVERAGE ORDER VALUE
  ========================================================== */

  const averageOrderTrend =
    useMemo(
      () =>
        revenueTrend.map(
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
        ),
      [revenueTrend],
    );


  /* ==========================================================
     11. CANCELLATION RATE
  ========================================================== */

  const cancellationTrend =
    useMemo(
      () =>
        revenueTrend.map(
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
                    key === row.date &&
                    order.status
                      .toLowerCase() ===
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
                Number(
                  rate.toFixed(2),
                ),
            };
          },
        ),
      [
        revenueTrend,
        filteredOrders,
      ],
    );


  /* ==========================================================
     12. INVENTORY
  ========================================================== */

  const inventoryStatus =
    useMemo(() => {
      const inStock =
        menuItems.filter(
          (item) =>
            item.stock > 5,
        ).length;

      const lowStock =
        menuItems.filter(
          (item) =>
            item.stock > 0 &&
            item.stock <= 5,
        ).length;

      const outOfStock =
        menuItems.filter(
          (item) =>
            item.stock <= 0,
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
     SELECTED CHART
  ========================================================== */

  const selectedChartInfo =
    CHART_OPTIONS.find(
      (chart) =>
        chart.key ===
        selectedChart,
    ) ??
    CHART_OPTIONS[0];


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
          Loading analytics...
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
                navigate(
                  "/admin",
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
            >
              <ArrowLeft
                size={18}
              />
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
                Analytics
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Explore your canteen performance.
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
              onClick={
                handleRefresh
              }
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


      <main className="mx-auto max-w-7xl px-6 py-8">

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
            PAGE HEADER
        ==================================================== */}

        <section className="mb-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-sm font-medium text-[#32145f]">
                Business Intelligence
              </p>

              <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
                Canteen Performance
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Select an analytics view instead of scrolling through every chart.
              </p>

            </div>

            <select
              value={range}
              onChange={(event) =>
                setRange(
                  event.target.value as RangeOption,
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-50 lg:w-auto"
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
            KPI CARDS
        ==================================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <KpiCard
            label="Revenue"
            value={currency(
              summary.revenue,
            )}
            icon={
              <TrendingUp
                size={20}
              />
            }
          />

          <KpiCard
            label="Orders"
            value={
              summary.totalOrders
            }
            icon={
              <ShoppingBag
                size={20}
              />
            }
          />

          <KpiCard
            label="Average Order"
            value={currency(
              summary.averageOrder,
            )}
            icon={
              <BarChart3
                size={20}
              />
            }
          />

          <KpiCard
            label="Items Sold"
            value={
              summary.totalUnits
            }
            icon={
              <CheckCircle2
                size={20}
              />
            }
          />

        </section>


        {/* ====================================================
            STATUS SUMMARY
        ==================================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <MiniStat
            label="Pending"
            value={
              summary.pending
            }
            icon={
              <Clock3 size={18} />
            }
            className="text-yellow-700"
          />

          <MiniStat
            label="Confirmed"
            value={
              summary.confirmed
            }
            icon={
              <CheckCircle2
                size={18}
              />
            }
            className="text-blue-700"
          />

          <MiniStat
            label="Completed"
            value={
              summary.completed
            }
            icon={
              <CheckCircle2
                size={18}
              />
            }
            className="text-green-700"
          />

          <MiniStat
            label="Cancellation Rate"
            value={`${summary.cancellationRate.toFixed(
              1,
            )}%`}
            icon={
              <XCircle
                size={18}
              />
            }
            className="text-red-600"
          />

        </section>


        {/* ====================================================
            ANALYTICS SELECTOR + CHART
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          {/* SECTION HEADER */}

          <div className="border-b border-gray-100 p-5">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Analytics Views
                </p>

                <h3 className="mt-1 font-bold text-[#24113f]">
                  Choose a report
                </h3>

              </div>

              <span className="text-xs text-gray-400">
                {CHART_OPTIONS.length} views available
              </span>

            </div>

          </div>


          <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">

            {/* ==================================================
                CHART SELECTOR
            ================================================== */}

            <aside className="border-b border-gray-100 bg-gray-50 p-3 lg:border-b-0 lg:border-r">

              <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">

                {CHART_OPTIONS.map(
                  (chart) => {
                    const active =
                      selectedChart ===
                      chart.key;

                    return (
                      <button
                        key={chart.key}
                        type="button"
                        onClick={() =>
                          setSelectedChart(
                            chart.key,
                          )
                        }
                        className={`flex min-w-[180px] shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:w-full ${
                          active
                            ? "bg-[#32145f] text-white shadow-sm"
                            : "text-gray-600 hover:bg-white hover:text-[#32145f]"
                        }`}
                      >

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? "bg-white/15 text-white"
                              : "bg-white text-[#32145f]"
                          }`}
                        >
                          {chart.icon}
                        </span>

                        <span className="min-w-0">

                          <span
                            className={`block truncate text-xs font-bold ${
                              active
                                ? "text-white"
                                : "text-[#24113f]"
                            }`}
                          >
                            {
                              chart.title
                            }
                          </span>

                          <span
                            className={`mt-0.5 block truncate text-[10px] ${
                              active
                                ? "text-purple-200"
                                : "text-gray-400"
                            }`}
                          >
                            {
                              chart.description
                            }
                          </span>

                        </span>

                      </button>
                    );
                  },
                )}

              </div>

            </aside>


            {/* ==================================================
                CHART AREA
            ================================================== */}

            <div className="min-w-0 p-5 sm:p-7">

              <div className="mb-5">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-sm font-medium text-[#32145f]">
                      Selected View
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-[#24113f]">
                      {
                        selectedChartInfo.title
                      }
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      {
                        selectedChartInfo.description
                      }
                    </p>

                  </div>

                  <span className="hidden rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#32145f] sm:inline-flex">
                    {range === "all"
                      ? "All Time"
                      : `Last ${range} Days`}
                  </span>

                </div>

              </div>


              <div className="h-[420px] w-full">

                {selectedChart ===
                  "revenue" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        revenueTrend
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          currency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#32145f"
                        strokeWidth={
                          3
                        }
                        dot={{
                          r: 3,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "orders" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        ordersTrend
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis
                        allowDecimals={
                          false
                        }
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
                )}


                {selectedChart ===
                  "status" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={
                          statusChart
                        }
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={
                          135
                        }
                        label
                      >
                        {statusChart.map(
                          (
                            entry,
                          ) => (
                            <Cell
                              key={
                                entry.name
                              }
                              fill={
                                STATUS_COLORS[
                                  entry
                                    .name
                                ] ??
                                "#32145f"
                              }
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "daily-sales" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        dailySales
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          currency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <Bar
                        dataKey="sales"
                        name="Sales"
                        fill="#32145f"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "weekly-sales" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        weeklySales
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          currency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Weekly Revenue"
                        stroke="#32145f"
                        strokeWidth={
                          3
                        }
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "monthly-sales" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        monthlySales
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          currency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="#32145f"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "top-items" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        topItems
                      }
                      layout="vertical"
                      margin={{
                        left: 20,
                        right: 20,
                      }}
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
                        width={150}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="quantity"
                        name="Quantity Sold"
                        fill="#32145f"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "item-revenue" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        itemRevenue
                      }
                      layout="vertical"
                      margin={{
                        left: 20,
                        right: 20,
                      }}
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
                        width={150}
                      />

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          currency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="#32145f"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "customers" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        customerOrders
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="customer"
                      />

                      <YAxis
                        allowDecimals={
                          false
                        }
                      />

                      <Tooltip />

                      <Bar
                        dataKey="orders"
                        name="Orders"
                        fill="#32145f"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "average-order" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        averageOrderTrend
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          currency(
                            Number(
                              value,
                            ),
                          )
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="average"
                        name="Average Order"
                        stroke="#32145f"
                        strokeWidth={
                          3
                        }
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "cancellation" && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        cancellationTrend
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="label"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          `${Number(
                            value,
                          ).toFixed(
                            2,
                          )}%`
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="Cancellation %"
                        stroke="#dc2626"
                        strokeWidth={
                          3
                        }
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}


                {selectedChart ===
                  "inventory" && (
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
                        outerRadius={
                          135
                        }
                        label
                      >
                        {inventoryStatus.map(
                          (
                            entry,
                          ) => (
                            <Cell
                              key={
                                entry.name
                              }
                              fill={
                                INVENTORY_COLORS[
                                  entry
                                    .name
                                ] ??
                                "#32145f"
                              }
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            LIVE STATUS
        ==================================================== */}

        <section className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                <h3 className="font-bold text-green-800">
                  Live Analytics Active
                </h3>

              </div>

              <p className="mt-1 text-sm text-green-700">
                Analytics refresh automatically from SmartCanteen data.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin",
                )
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
            >
              <ArrowLeft
                size={17}
              />
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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 ${className}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-[#24113f]">
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   MINI STAT
============================================================ */

function MiniStat({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 ${className}`}
      >
        {icon}
      </div>

      <div>

        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="mt-0.5 text-lg font-bold text-[#24113f]">
          {value}
        </p>

      </div>

    </div>
  );
}