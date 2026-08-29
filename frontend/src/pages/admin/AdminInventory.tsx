import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  createInventory,
  deleteInventory,
  getInventory,
  updateInventory,
  type InventoryItem,
} from "../../api/inventory";

import { api } from "../../api/client";


/* ============================================================
   MENU ITEM TYPE
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
}


/* ============================================================
   FORM
============================================================ */

interface InventoryForm {
  menu_item_id: string;
  quantity: string;
  unit: string;
}


const emptyForm: InventoryForm = {
  menu_item_id: "",
  quantity: "0",
  unit: "units",
};


/* ============================================================
   ADMIN INVENTORY
============================================================ */

export default function AdminInventory() {
  const navigate = useNavigate();

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [stockFilter, setStockFilter] =
    useState<
      "all" | "healthy" | "low" | "out"
    >("all");

  const [showModal, setShowModal] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState<InventoryItem | null>(null);

  const [form, setForm] =
    useState<InventoryForm>(
      emptyForm,
    );


  /* ==========================================================
     LOAD INVENTORY
  ========================================================== */

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

      const [
        inventoryData,
        menuResponse,
      ] = await Promise.all([
        getInventory(),

        api.get<MenuItem[]>(
          "/menu/",
        ),
      ]);

      setInventory(
        Array.isArray(inventoryData)
          ? inventoryData
          : [],
      );

      setMenuItems(
        Array.isArray(
          menuResponse.data,
        )
          ? menuResponse.data
          : [],
      );
    } catch (err: any) {
      console.error(
        "Inventory loading error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  useEffect(() => {
    void loadInventory();
  }, []);


  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics =
    useMemo(() => {
      const total =
        inventory.length;

      const totalQuantity =
        inventory.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            Number(
              item.quantity || 0,
            ),
          0,
        );

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

      const healthy =
        inventory.filter(
          (item) =>
            item.quantity > 5,
        ).length;

      return {
        total,
        totalQuantity,
        lowStock,
        outOfStock,
        healthy,
      };
    }, [inventory]);


  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredInventory =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return inventory.filter(
        (item) => {
          const name =
            item.menu_item_name
              .toLowerCase();

          const id =
            String(
              item.menu_item_id,
            );

          const matchesSearch =
            !query ||
            name.includes(query) ||
            id.includes(query);

          const matchesStock =
            stockFilter === "all" ||
            (
              stockFilter === "out" &&
              item.quantity <= 0
            ) ||
            (
              stockFilter === "low" &&
              item.quantity > 0 &&
              item.quantity <= 5
            ) ||
            (
              stockFilter === "healthy" &&
              item.quantity > 5
            );

          return (
            matchesSearch &&
            matchesStock
          );
        },
      );
    }, [
      inventory,
      search,
      stockFilter,
    ]);


  /* ==========================================================
     OPEN CREATE
  ========================================================== */

  function openCreate() {
    setEditingItem(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }


  /* ==========================================================
     OPEN EDIT
  ========================================================== */

  function openEdit(
    item: InventoryItem,
  ) {
    setEditingItem(item);

    setForm({
      menu_item_id:
        String(
          item.menu_item_id,
        ),
      quantity:
        String(
          item.quantity,
        ),
      unit:
        item.unit ||
        "units",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }


  /* ==========================================================
     CLOSE MODAL
  ========================================================== */

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingItem(null);
    setForm(emptyForm);
  }


  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  function updateForm(
    field: keyof InventoryForm,
    value: string,
  ) {
    setForm(
      (
        previous,
      ) => ({
        ...previous,
        [field]: value,
      }),
    );
  }


  /* ==========================================================
     SAVE
  ========================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const quantity =
      Number(
        form.quantity,
      );

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 0
    ) {
      setError(
        "Quantity must be a whole number greater than or equal to 0.",
      );
      return;
    }

    const unit =
      form.unit.trim();

    if (!unit) {
      setError(
        "Unit is required.",
      );
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        const updated =
          await updateInventory(
            editingItem.id,
            {
              quantity,
              unit,
            },
          );

        setInventory(
          (
            current,
          ) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item,
            ),
        );

        setSuccess(
          `${updated.menu_item_name} inventory updated successfully.`,
        );
      } else {
        const menuItemId =
          Number(
            form.menu_item_id,
          );

        if (
          !Number.isInteger(
            menuItemId,
          ) ||
          menuItemId <= 0
        ) {
          setError(
            "Please select a menu item.",
          );
          return;
        }

        const exists =
          inventory.some(
            (item) =>
              item.menu_item_id ===
              menuItemId,
          );

        if (exists) {
          setError(
            "Inventory already exists for this menu item. Edit the existing record instead.",
          );
          return;
        }

        const created =
          await createInventory({
            menu_item_id:
              menuItemId,
            quantity,
            unit,
          });

        setInventory(
          (
            current,
          ) => [
            created,
            ...current,
          ],
        );

        setSuccess(
          `${created.menu_item_name} inventory created successfully.`,
        );
      }

      setShowModal(false);
      setEditingItem(null);
      setForm(emptyForm);
    } catch (err: any) {
      console.error(
        "Inventory save error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to save inventory.",
      );
    } finally {
      setSaving(false);
    }
  }


  /* ==========================================================
     DELETE
  ========================================================== */

  async function handleDelete(
    item: InventoryItem,
  ) {
    const confirmed =
      window.confirm(
        `Delete inventory for "${item.menu_item_name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteInventory(
        item.id,
      );

      setInventory(
        (current) =>
          current.filter(
            (value) =>
              value.id !==
              item.id,
          ),
      );

      setSuccess(
        `${item.menu_item_name} inventory deleted successfully.`,
      );
    } catch (err: any) {
      console.error(
        "Inventory delete error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to delete inventory.",
      );
    }
  }


  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadInventory(false);
  }


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

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-medium text-purple-200">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white">
              Inventory Management
            </h1>

            <p className="mt-1 text-sm text-purple-200">
              Add, edit, delete and monitor food stock.
            </p>

          </div>


          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin",
                )
              }
              className="rounded-xl border border-white/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
              className="flex items-center gap-2 rounded-xl border border-white/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50 disabled:opacity-50"
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

            <button
              type="button"
              onClick={
                openCreate
              }
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50"
            >

              <Plus
                size={18}
              />

              Add Inventory

            </button>

          </div>

        </div>

      </header>


      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            ALERT
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

          </div>
        )}


        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">

            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p className="font-semibold">
              {success}
            </p>

          </div>
        )}


        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <InventoryStat
            icon={
              <Package
                size={20}
              />
            }
            label="Inventory Items"
            value={
              statistics.total
            }
          />

          <InventoryStat
            icon={
              <CheckCircle2
                size={20}
              />
            }
            label="Healthy Stock"
            value={
              statistics.healthy
            }
            className="bg-green-50 text-green-700"
          />

          <InventoryStat
            icon={
              <AlertCircle
                size={20}
              />
            }
            label="Low Stock"
            value={
              statistics.lowStock
            }
            className="bg-yellow-50 text-yellow-700"
          />

          <InventoryStat
            icon={
              <XCircle
                size={20}
              />
            }
            label="Out of Stock"
            value={
              statistics.outOfStock
            }
            className="bg-red-50 text-red-600"
          />

        </section>


        {/* ====================================================
            SEARCH / FILTER
        ==================================================== */}

        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-xl">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search food inventory..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />

            </div>


            <div className="flex flex-wrap gap-2">

              <FilterButton
                active={
                  stockFilter ===
                  "all"
                }
                onClick={() =>
                  setStockFilter(
                    "all",
                  )
                }
              >
                All
              </FilterButton>

              <FilterButton
                active={
                  stockFilter ===
                  "healthy"
                }
                onClick={() =>
                  setStockFilter(
                    "healthy",
                  )
                }
              >
                Healthy
              </FilterButton>

              <FilterButton
                active={
                  stockFilter ===
                  "low"
                }
                onClick={() =>
                  setStockFilter(
                    "low",
                  )
                }
              >
                Low Stock
              </FilterButton>

              <FilterButton
                active={
                  stockFilter ===
                  "out"
                }
                onClick={() =>
                  setStockFilter(
                    "out",
                  )
                }
              >
                Out of Stock
              </FilterButton>

            </div>

          </div>

        </section>


        {/* ====================================================
            TABLE
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-100 p-6">

            <div>

              <h2 className="font-bold text-[#24113f]">
                Inventory
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {filteredInventory.length}{" "}
                record
                {filteredInventory.length ===
                1
                  ? ""
                  : "s"}{" "}
                shown
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">

              <Package
                size={19}
              />

            </div>

          </div>


          {filteredInventory.length ===
          0 ? (

            <div className="p-16 text-center">

              <Package
                size={44}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 font-semibold text-[#24113f]">
                No inventory found
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Add inventory for one of your menu items.
              </p>

              <button
                type="button"
                onClick={
                  openCreate
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white"
              >

                <Plus
                  size={17}
                />

                Add Inventory

              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      Food Item
                    </th>

                    <th className="px-6 py-4">
                      Menu ID
                    </th>

                    <th className="px-6 py-4">
                      Quantity
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Updated
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100">

                  {filteredInventory.map(
                    (item) => {

                      const quantity =
                        Number(
                          item.quantity ||
                            0,
                        );

                      const out =
                        quantity <= 0;

                      const low =
                        quantity > 0 &&
                        quantity <= 5;

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* FOOD */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-4">

                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">

                                <Package
                                  size={20}
                                />

                              </div>

                              <div>

                                <p className="font-semibold text-[#24113f]">
                                  {
                                    item.menu_item_name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                  Inventory #
                                  {
                                    item.id
                                  }
                                </p>

                              </div>

                            </div>

                          </td>


                          {/* MENU ID */}

                          <td className="px-6 py-5 text-sm text-gray-500">
                            #
                            {
                              item.menu_item_id
                            }
                          </td>


                          {/* QUANTITY */}

                          <td className="px-6 py-5">

                            <span
                              className={`text-lg font-bold ${
                                out
                                  ? "text-red-600"
                                  : low
                                    ? "text-yellow-700"
                                    : "text-[#24113f]"
                              }`}
                            >
                              {
                                quantity
                              }
                            </span>

                            <span className="ml-1 text-sm text-gray-400">
                              {
                                item.unit
                              }
                            </span>

                          </td>


                          {/* STATUS */}

                          <td className="px-6 py-5">

                            {out ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">

                                <XCircle
                                  size={14}
                                />

                                Out of Stock

                              </span>
                            ) : low ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">

                                <AlertCircle
                                  size={14}
                                />

                                Low Stock

                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">

                                <CheckCircle2
                                  size={14}
                                />

                                Healthy

                              </span>
                            )}

                          </td>


                          {/* UPDATED */}

                          <td className="px-6 py-5 text-sm text-gray-400">

                            {new Date(
                              item.updated_at,
                            ).toLocaleString()}

                          </td>


                          {/* ACTIONS */}

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    item,
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-purple-100 hover:bg-purple-50 hover:text-[#32145f]"
                              >

                                <Edit3
                                  size={15}
                                />

                                Edit

                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item,
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                              >

                                <Trash2
                                  size={15}
                                />

                                Delete

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

      </main>


      {/* ======================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 p-6">

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  Inventory
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#24113f]">

                  {editingItem
                    ? "Edit Inventory"
                    : "Add Inventory"}

                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100"
              >

                <X
                  size={19}
                />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >

              {/* MENU ITEM */}

              <div className="mb-5">

                <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                  Food Item
                </label>

                {editingItem ? (

                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">

                    <p className="font-semibold text-[#24113f]">
                      {
                        editingItem.menu_item_name
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Menu Item #
                      {
                        editingItem.menu_item_id
                      }
                    </p>

                  </div>

                ) : (

                  <select
                    value={
                      form.menu_item_id
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "menu_item_id",
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
                  >

                    <option value="">
                      Select a food item
                    </option>

                    {menuItems
                      .filter(
                        (menuItem) =>
                          !inventory.some(
                            (item) =>
                              item.menu_item_id ===
                              menuItem.id,
                          ),
                      )
                      .map(
                        (
                          menuItem,
                        ) => (
                          <option
                            key={
                              menuItem.id
                            }
                            value={
                              menuItem.id
                            }
                          >
                            {
                              menuItem.name
                            }
                            {" "}
                            (#
                            {
                              menuItem.id
                            })
                          </option>
                        ),
                      )}

                  </select>

                )}

              </div>


              {/* QUANTITY */}

              <div className="mb-5">

                <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.quantity
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "quantity",
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    saving
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
                />

              </div>


              {/* UNIT */}

              <div className="mb-6">

                <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                  Unit
                </label>

                <select
                  value={
                    form.unit
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "unit",
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    saving
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
                >

                  <option value="units">
                    Units
                  </option>

                  <option value="pieces">
                    Pieces
                  </option>

                  <option value="plates">
                    Plates
                  </option>

                  <option value="boxes">
                    Boxes
                  </option>

                  <option value="kg">
                    Kilograms
                  </option>

                  <option value="litres">
                    Litres
                  </option>

                </select>

              </div>


              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:border-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={17}
                      />

                      {editingItem
                        ? "Save Changes"
                        : "Create Inventory"}

                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}


/* ============================================================
   INVENTORY STAT
============================================================ */

function InventoryStat({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#32145f] ${className}`}
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
   FILTER BUTTON
============================================================ */

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
        active
          ? "bg-[#32145f] text-white"
          : "border border-gray-200 bg-white text-gray-500 hover:border-purple-100 hover:text-[#32145f]"
      }`}
    >
      {children}
    </button>
  );
}