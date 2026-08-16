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

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";

interface InventoryItem {
  id?: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit: string;
}

type StockStatus =
  | "in-stock"
  | "low-stock"
  | "out-of-stock";

function getStockStatus(
  quantity: number,
): StockStatus {
  if (quantity <= 0) {
    return "out-of-stock";
  }

  if (quantity <= 5) {
    return "low-stock";
  }

  return "in-stock";
}

export default function StaffInventory() {
  const navigate = useNavigate();

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [inputs, setInputs] =
    useState<Record<number, string>>({});

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadInventory(
    initial = true,
  ) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response =
        await api.get<InventoryItem[]>(
          "/inventory/",
        );

      const data =
        Array.isArray(response.data)
          ? response.data
          : [];

      setInventory(data);

      const initialInputs:
        Record<number, string> = {};

      data.forEach((item) => {
        initialInputs[
          item.menu_item_id
        ] = "";
      });

      setInputs(initialInputs);
    } catch (err: any) {
      console.error(
        "Staff inventory error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  function updateInput(
    menuItemId: number,
    value: string,
  ) {
    if (
      value !== "" &&
      !/^\d+$/.test(value)
    ) {
      return;
    }

    setInputs((current) => ({
      ...current,
      [menuItemId]: value,
    }));
  }

  async function handleRestock(
    item: InventoryItem,
  ) {
    const value =
      inputs[item.menu_item_id];

    const amount = Number(value);

    if (
      !value ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setError(
        "Enter a valid restock quantity.",
      );
      return;
    }

    try {
      setSavingId(
        item.menu_item_id,
      );

      setError("");
      setSuccess("");

      /*
       * This matches the inventory update
       * structure used by your current
       * AdminInventory page.
       */
      const response =
        await api.patch<InventoryItem>(
          `/inventory/${item.menu_item_id}`,
          {
            quantity: amount,
            operation: "add",
          },
        );

      setInventory((current) =>
        current.map(
          (currentItem) =>
            currentItem.menu_item_id ===
            item.menu_item_id
              ? response.data
              : currentItem,
        ),
      );

      setInputs((current) => ({
        ...current,
        [item.menu_item_id]: "",
      }));

      setSuccess(
        `${item.menu_item_name} restocked successfully.`,
      );
    } catch (err: any) {
      console.error(
        "Restock error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to update stock.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const lowStock =
    inventory.filter(
      (item) =>
        item.quantity > 0 &&
        item.quantity <= 5,
    ).length;

  const outOfStock =
    inventory.filter(
      (item) =>
        item.quantity <= 0,
    ).length;

  const inStock =
    inventory.filter(
      (item) =>
        item.quantity > 5,
    ).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading staff inventory...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/staff")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-sm text-purple-200">
                Staff Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Inventory
              </h1>

              <p className="mt-1 text-sm text-purple-200">
                Monitor stock and restock food items.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              loadInventory(false)
            }
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] hover:bg-purple-50 disabled:opacity-50"
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

      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle size={20} />

            <div className="flex-1">
              <p className="font-semibold">
                Inventory error
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>

          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">

            <CheckCircle2 size={20} />

            <p className="font-semibold">
              {success}
            </p>

          </div>
        )}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <InventoryStat
            label="Total Items"
            value={inventory.length}
            icon={
              <Package size={20} />
            }
          />

          <InventoryStat
            label="In Stock"
            value={inStock}
            icon={
              <CheckCircle2
                size={20}
              />
            }
            className="bg-green-50 text-green-700"
          />

          <InventoryStat
            label="Low Stock"
            value={lowStock}
            icon={
              <AlertCircle size={20} />
            }
            className="bg-yellow-50 text-yellow-700"
          />

          <InventoryStat
            label="Out of Stock"
            value={outOfStock}
            icon={
              <XCircle size={20} />
            }
            className="bg-red-50 text-red-600"
          />

        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <h2 className="font-bold text-[#24113f]">
              Stock Management
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Staff can add stock but cannot create or delete inventory records.
            </p>

          </div>

          {inventory.length === 0 ? (
            <div className="p-16 text-center">
              <Package
                size={44}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 font-semibold text-gray-600">
                No inventory items found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      Item
                    </th>

                    <th className="px-6 py-4">
                      Current Stock
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Add Stock
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {inventory.map(
                    (item) => {
                      const status =
                        getStockStatus(
                          item.quantity,
                        );

                      const saving =
                        savingId ===
                        item.menu_item_id;

                      return (
                        <tr
                          key={
                            item.menu_item_id
                          }
                          className="hover:bg-gray-50"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                                <Package
                                  size={19}
                                />
                              </div>

                              <div>
                                <p className="font-semibold text-[#24113f]">
                                  {
                                    item.menu_item_name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                  Menu Item #
                                  {
                                    item.menu_item_id
                                  }
                                </p>
                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <span className="text-xl font-bold text-[#24113f]">
                              {
                                item.quantity
                              }
                            </span>

                            <span className="ml-2 text-sm text-gray-400">
                              {item.unit}
                            </span>

                          </td>

                          <td className="px-6 py-5">

                            <StockBadge
                              status={
                                status
                              }
                            />

                          </td>

                          <td className="px-6 py-5">

                            <div className="relative w-32">

                              <Plus
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />

                              <input
                                type="number"
                                min="1"
                                value={
                                  inputs[
                                    item.menu_item_id
                                  ] ||
                                  ""
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateInput(
                                    item.menu_item_id,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                disabled={saving}
                                placeholder="Qty"
                                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#32145f] disabled:bg-gray-50"
                              />

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <div className="flex justify-end">

                              <button
                                type="button"
                                onClick={() =>
                                  handleRestock(
                                    item,
                                  )
                                }
                                disabled={
                                  saving ||
                                  !inputs[
                                    item.menu_item_id
                                  ]
                                }
                                className="flex items-center gap-2 rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-40"
                              >

                                {saving ? (
                                  <Loader2
                                    size={
                                      16
                                    }
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Save
                                    size={
                                      16
                                    }
                                  />
                                )}

                                {saving
                                  ? "Saving..."
                                  : "Restock"}

                              </button>

                            </div>

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

        <div className="mt-8 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate("/staff")
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:border-purple-100 hover:text-[#32145f]"
          >
            <ArrowLeft size={17} />
            Staff Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/staff/orders",
              )
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] hover:bg-purple-100"
          >
            Manage Orders
          </button>

        </div>

      </main>
    </div>
  );
}

/* ============================================================
   STAT
============================================================ */

function InventoryStat({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f] ${className}`}
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
   STOCK BADGE
============================================================ */

function StockBadge({
  status,
}: {
  status: StockStatus;
}) {
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