import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";

/* ============================================================
   TYPES
============================================================ */

interface InventoryItem {
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit: string;
}

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

/* ============================================================
   HELPERS
============================================================ */

function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) {
    return "out-of-stock";
  }

  if (quantity <= 5) {
    return "low-stock";
  }

  return "in-stock";
}

function getApiError(error: any, fallback: string) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Validation error")
      .join(", ");
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

/* ============================================================
   STOCK BADGE
============================================================ */

function StockBadge({
  quantity,
}: {
  quantity: number;
}) {
  const status = getStockStatus(quantity);

  if (status === "out-of-stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
        <XCircle size={14} />
        Out of Stock
      </span>
    );
  }

  if (status === "low-stock") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
        <AlertCircle size={14} />
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 size={14} />
      In Stock
    </span>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  icon,
  className = "text-[#32145f]",
}: {
  label: string;
  value: number;
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

      <p className="mt-1 text-3xl font-bold text-[#24113f]">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   ADMIN INVENTORY
============================================================ */

export default function AdminInventory() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [savingId, setSavingId] = useState<number | null>(
    null,
  );

  const [stockInputs, setStockInputs] = useState<
    Record<number, string>
  >({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ==========================================================
     LOAD INVENTORY
  ========================================================== */

  async function loadInventory(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get<InventoryItem[]>(
        "/inventory",
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setInventory(data);

      const initialInputs: Record<number, string> = {};

      data.forEach((item) => {
        initialInputs[item.menu_item_id] = "";
      });

      setStockInputs(initialInputs);
    } catch (err: any) {
      setError(
        getApiError(
          err,
          "Unable to load inventory.",
        ),
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
    loadInventory();
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadInventory(false);
  }

  /* ==========================================================
     UPDATE INPUT
  ========================================================== */

  function updateInput(
    menuItemId: number,
    value: string,
  ) {
    if (value === "") {
      setStockInputs((current) => ({
        ...current,
        [menuItemId]: "",
      }));

      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue < 0) {
      return;
    }

    setStockInputs((current) => ({
      ...current,
      [menuItemId]: value,
    }));
  }

  /* ==========================================================
     RESTOCK
  ========================================================== */

  async function handleRestock(item: InventoryItem) {
    const input = stockInputs[item.menu_item_id] || "";

    const amount = Number(input);

    if (!input) {
      setError("Enter a restock quantity.");
      return;
    }

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setError(
        "Restock quantity must be a whole number greater than zero.",
      );
      return;
    }

    try {
      setSavingId(item.menu_item_id);
      setError("");
      setSuccess("");

      /*
       * Adds the entered quantity to the current stock.
       *
       * Example:
       * Current stock = 10
       * Restock = 5
       * New stock = 15
       */

      const response =
        await api.patch<InventoryItem>(
          `/inventory/${item.menu_item_id}`,
          {
            quantity: amount,
            operation: "add",
          },
        );

      const updatedItem = response.data;

      setInventory((current) =>
        current.map((currentItem) =>
          currentItem.menu_item_id ===
          item.menu_item_id
            ? updatedItem
            : currentItem,
        ),
      );

      setStockInputs((current) => ({
        ...current,
        [item.menu_item_id]: "",
      }));

      setSuccess(
        `${item.menu_item_name} stock updated successfully.`,
      );
    } catch (err: any) {
      setError(
        getApiError(
          err,
          "Unable to update inventory.",
        ),
      );
    } finally {
      setSavingId(null);
    }
  }

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics = useMemo(() => {
    const totalItems = inventory.length;

    const outOfStock = inventory.filter(
      (item) => item.quantity <= 0,
    ).length;

    const lowStock = inventory.filter(
      (item) =>
        item.quantity > 0 &&
        item.quantity <= 5,
    ).length;

    const inStock = inventory.filter(
      (item) => item.quantity > 5,
    ).length;

    const totalQuantity = inventory.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0,
    );

    return {
      totalItems,
      outOfStock,
      lowStock,
      inStock,
      totalQuantity,
    };
  }, [inventory]);

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

          Loading inventory...
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-purple-100 transition hover:bg-white/20 hover:text-white"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-sm font-medium text-purple-200">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Inventory Management
              </h1>

              <p className="mt-1 text-sm text-purple-200">
                Monitor and restock your canteen inventory.
              </p>
            </div>

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
            PAGE TITLE
        ==================================================== */}

        <section className="mb-8">

          <p className="text-sm font-medium text-[#32145f]">
            Inventory
          </p>

          <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
            Manage Stock
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Monitor stock levels for your menu items
            and quickly add stock when supplies arrive.
          </p>

        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Inventory Error
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>

          </div>
        )}

        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">

            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Success
              </p>

              <p className="mt-1">
                {success}
              </p>

            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-500 hover:text-green-700"
            >
              ×
            </button>

          </div>
        )}

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            label="Total Items"
            value={statistics.totalItems}
            icon={<Package size={21} />}
          />

          <SummaryCard
            label="In Stock"
            value={statistics.inStock}
            icon={
              <CheckCircle2 size={21} />
            }
            className="text-green-700"
          />

          <SummaryCard
            label="Low Stock"
            value={statistics.lowStock}
            icon={
              <AlertCircle size={21} />
            }
            className="text-yellow-700"
          />

          <SummaryCard
            label="Out of Stock"
            value={statistics.outOfStock}
            icon={<XCircle size={21} />}
            className="text-red-600"
          />

        </section>

        {/* ====================================================
            INVENTORY TABLE
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="border-b border-gray-100 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                <Package size={22} />
              </div>

              <div>

                <h3 className="font-bold text-[#24113f]">
                  Inventory
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Current stock levels for all menu items
                </p>

              </div>

            </div>

          </div>

          {/* EMPTY */}

          {inventory.length === 0 ? (

            <div className="p-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#32145f]">
                <Package size={30} />
              </div>

              <h3 className="mt-5 font-bold text-[#24113f]">
                No inventory items found
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                Add menu items first to create inventory.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/menu")
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
              >
                <Plus size={17} />

                Manage Menu
              </button>

            </div>

          ) : (

            /* ==================================================
               TABLE
            ================================================== */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left">

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Item
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Current Stock
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Restock Quantity
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {inventory.map((item) => {

                    const saving =
                      savingId ===
                      item.menu_item_id;

                    const inputValue =
                      stockInputs[
                        item.menu_item_id
                      ] || "";

                    return (
                      <tr
                        key={item.menu_item_id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* ITEM */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                              <Package size={19} />
                            </div>

                            <div>

                              <p className="font-semibold text-[#24113f]">
                                {item.menu_item_name}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                Menu Item #{item.menu_item_id}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* CURRENT STOCK */}

                        <td className="px-6 py-5">

                          <div className="flex items-baseline gap-2">

                            <span className="text-xl font-bold text-[#24113f]">
                              {item.quantity}
                            </span>

                            <span className="text-sm text-gray-400">
                              {item.unit || "units"}
                            </span>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <StockBadge
                            quantity={
                              item.quantity
                            }
                          />

                        </td>

                        {/* RESTOCK INPUT */}

                        <td className="px-6 py-5">

                          <div className="relative w-32">

                            <Plus
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={inputValue}
                              onChange={(event) =>
                                updateInput(
                                  item.menu_item_id,
                                  event.target.value,
                                )
                              }
                              placeholder="Qty"
                              disabled={saving}
                              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#32145f] focus:ring-2 focus:ring-purple-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                            />

                          </div>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">

                          <button
                            type="button"
                            onClick={() =>
                              handleRestock(item)
                            }
                            disabled={
                              saving ||
                              !inputValue
                            }
                            className="flex items-center gap-2 rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            {saving ? (
                              <>
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />

                                Saving...
                              </>
                            ) : (
                              <>
                                <Save size={16} />

                                Restock
                              </>
                            )}

                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="mt-8 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
          >
            <ArrowLeft size={17} />

            Admin Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/menu")
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100"
          >
            Manage Menu
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/orders")
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100"
          >
            Manage Orders
          </button>

        </div>

      </main>
    </div>
  );
}