import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  Menu as MenuIcon,
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
  createMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  updateMenuItem,
  type AdminMenuItem,
} from "../../api/admin";

import { api } from "../../api/client";

/* ============================================================
   TYPES
============================================================ */

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
}

interface MenuForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  image_url: string;
  is_available: boolean;
}

/* ============================================================
   DEFAULT FORM
============================================================ */

const emptyForm: MenuForm = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  category_id: "",
  image_url: "",
  is_available: true,
};

/* ============================================================
   CATEGORY API
============================================================ */

async function getCategories(): Promise<Category[]> {
  const response =
    await api.get<Category[]>("/categories/");

  return Array.isArray(response.data)
    ? response.data
    : [];
}

/* ============================================================
   ADMIN MENU
============================================================ */

export default function AdminMenu() {
  const navigate = useNavigate();

  /* ==========================================================
     DATA
  ========================================================== */

  const [items, setItems] =
    useState<AdminMenuItem[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  /* ==========================================================
     ALERTS
  ========================================================== */

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [search, setSearch] =
    useState("");

  const [availabilityFilter, setAvailabilityFilter] =
    useState("all");

  /* ==========================================================
     MODAL
  ========================================================== */

  const [showModal, setShowModal] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState<AdminMenuItem | null>(null);

  const [form, setForm] =
    useState<MenuForm>(emptyForm);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  async function loadMenu(
    showInitialLoading = true,
  ) {
    try {
      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [
        menuData,
        categoryData,
      ] = await Promise.all([
        getAllMenuItems(),
        getCategories(),
      ]);

      setItems(
        Array.isArray(menuData)
          ? menuData
          : [],
      );

      setCategories(categoryData);
    } catch (err: any) {
      console.error(
        "Admin menu load error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load menu items.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadMenu(false);
  }

  /* ==========================================================
     NORMALIZE MENU ITEM
  ========================================================== */

  function getItemName(
    item: AdminMenuItem,
  ) {
    return item.name || "Unnamed Item";
  }

  function getItemPrice(
    item: AdminMenuItem,
  ) {
    return Number(item.price ?? 0);
  }

  function getItemStock(
    item: AdminMenuItem,
  ) {
    if (
      typeof item.stock ===
      "number"
    ) {
      return item.stock;
    }

    return 0;
  }

  function getItemAvailability(
    item: AdminMenuItem,
  ) {
    if (
      typeof item.is_available ===
      "boolean"
    ) {
      return item.is_available;
    }

    if (
      typeof item.available ===
      "boolean"
    ) {
      return item.available;
    }

    return true;
  }

  function getCategoryName(
    categoryId:
      | number
      | null
      | undefined,
  ) {
    if (
      categoryId === undefined ||
      categoryId === null
    ) {
      return "Uncategorized";
    }

    return (
      categories.find(
        (category) =>
          category.id ===
          categoryId,
      )?.name ||
      `Category #${categoryId}`
    );
  }

  /* ==========================================================
     FILTERED ITEMS
  ========================================================== */

  const filteredItems = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return items.filter((item) => {
      const name =
        getItemName(
          item,
        ).toLowerCase();

      const description =
        item.description?.toLowerCase() ||
        "";

      const categoryName =
        getCategoryName(
          item.category_id,
        ).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        description.includes(query) ||
        categoryName.includes(query);

      const available =
        getItemAvailability(item);

      const matchesAvailability =
        availabilityFilter ===
          "all" ||
        (availabilityFilter ===
          "available" &&
          available) ||
        (availabilityFilter ===
          "unavailable" &&
          !available);

      return (
        matchesSearch &&
        matchesAvailability
      );
    });
  }, [
    items,
    categories,
    search,
    availabilityFilter,
  ]);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics = useMemo(() => {
    const total = items.length;

    const available = items.filter(
      (item) =>
        getItemAvailability(item),
    ).length;

    const unavailable =
      items.filter(
        (item) =>
          !getItemAvailability(
            item,
          ),
      ).length;

    const outOfStock =
      items.filter(
        (item) =>
          getItemStock(item) <= 0,
      ).length;

    const lowStock = items.filter(
      (item) => {
        const stock =
          getItemStock(item);

        return (
          stock > 0 &&
          stock <= 5
        );
      },
    ).length;

    return {
      total,
      available,
      unavailable,
      outOfStock,
      lowStock,
    };
  }, [items]);

  /* ==========================================================
     OPEN CREATE
  ========================================================== */

  function openCreateModal() {
    setEditingItem(null);
    setForm(emptyForm);

    setError("");
    setSuccess("");

    setShowModal(true);
  }

  /* ==========================================================
     OPEN EDIT
  ========================================================== */

  function openEditModal(
    item: AdminMenuItem,
  ) {
    setEditingItem(item);

    setForm({
      name: item.name || "",
      description:
        item.description || "",
      price:
        item.price !== undefined
          ? String(item.price)
          : "",
      stock:
        item.stock !== undefined
          ? String(item.stock)
          : "0",
      category_id:
        item.category_id !==
        undefined
          ? String(item.category_id)
          : "",
      image_url:
        item.image_url || "",
      is_available:
        getItemAvailability(item),
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
    field: keyof MenuForm,
    value: string | boolean,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* ==========================================================
     SAVE MENU ITEM
  ========================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    if (!name) {
      setError(
        "Food item name is required.",
      );
      return;
    }

    const price =
      Number(form.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Price must be a valid number greater than or equal to 0.",
      );
      return;
    }

    const stock =
      Number(form.stock);

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError(
        "Stock must be a whole number greater than or equal to 0.",
      );
      return;
    }

    if (
      !form.category_id ||
      !Number.isInteger(
        Number(form.category_id),
      ) ||
      Number(form.category_id) <=
        0
    ) {
      setError(
        "Please select a category.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload: Record<
        string,
        unknown
      > = {
        name,
        description:
          form.description.trim() ||
          null,
        price,
        stock,
        category_id:
          Number(form.category_id),
        image_url:
          form.image_url.trim() ||
          null,
        is_available:
          form.is_available,
      };

      if (editingItem) {
        const updated =
          await updateMenuItem(
            editingItem.id,
            payload,
          );

        setItems((previous) =>
          previous.map((item) =>
            item.id === updated.id
              ? updated
              : item,
          ),
        );

        setSuccess(
          `"${name}" updated successfully.`,
        );
      } else {
        const created =
          await createMenuItem(
            payload,
          );

        setItems((previous) => [
          created,
          ...previous,
        ]);

        setSuccess(
          `"${name}" created successfully.`,
        );
      }

      closeModal();
    } catch (err: any) {
      console.error(
        "Menu save error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to save menu item.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     DELETE
  ========================================================== */

  async function handleDelete(
    item: AdminMenuItem,
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${getItemName(
          item,
        )}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteMenuItem(item.id);

      setItems((previous) =>
        previous.filter(
          (current) =>
            current.id !== item.id,
        ),
      );

      setSuccess(
        `"${getItemName(
          item,
        )}" deleted successfully.`,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to delete menu item.",
      );
    }
  }

  /* ==========================================================
     TOGGLE AVAILABILITY
  ========================================================== */

  async function handleToggleAvailability(
    item: AdminMenuItem,
  ) {
    const current =
      getItemAvailability(item);

    const categoryId =
      item.category_id;

    if (
      categoryId === undefined ||
      categoryId === null
    ) {
      setError(
        "This food item does not have a category.",
      );
      return;
    }

    try {
      setError("");
      setSuccess("");

      const updated =
        await updateMenuItem(
          item.id,
          {
            name:
              item.name || "",
            description:
              item.description ||
              null,
            price:
              Number(
                item.price || 0,
              ),
            stock:
              Number(
                item.stock || 0,
              ),
            category_id:
              categoryId,
            image_url:
              item.image_url ||
              null,
            is_available:
              !current,
          },
        );

      setItems((previous) =>
        previous.map(
          (currentItem) =>
            currentItem.id ===
            updated.id
              ? updated
              : currentItem,
        ),
      );

      setSuccess(
        `${getItemName(
          item,
        )} is now ${
          !current
            ? "available"
            : "unavailable"
        }.`,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to update item availability.",
      );
    }
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

          Loading menu...

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
              Menu Management
            </h1>

            <p className="mt-1 text-sm text-purple-200">
              Add, edit and organize canteen food items.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="rounded-xl border border-white/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/categories",
                )
              }
              className="flex items-center gap-2 rounded-xl border border-white/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50"
            >

              <FolderTree
                size={17}
              />

              Categories

            </button>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
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
                openCreateModal
              }
              disabled={
                categories.length ===
                0
              }
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Plus size={18} />

              Add Item

            </button>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">

            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">

              <p className="font-semibold">
                Something went wrong
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
              className="text-red-400 hover:text-red-600"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">

            <CheckCircle2
              size={19}
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
              onClick={() =>
                setSuccess("")
              }
              className="text-green-500 hover:text-green-700"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* ====================================================
            NO CATEGORIES WARNING
        ==================================================== */}

        {!categoriesLoading &&
          categories.length ===
            0 && (
            <div className="mb-8 rounded-2xl border border-yellow-100 bg-yellow-50 p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="font-semibold text-yellow-800">
                    No categories available
                  </p>

                  <p className="mt-1 text-sm text-yellow-700">
                    Create a category before adding a food item.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/admin/categories",
                    )
                  }
                  className="flex items-center gap-2 self-start rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white"
                >

                  <FolderTree
                    size={17}
                  />

                  Create Category

                </button>

              </div>

            </div>
          )}

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <MenuStat
            label="Total Items"
            value={
              statistics.total
            }
            icon={
              <MenuIcon size={20} />
            }
          />

          <MenuStat
            label="Available"
            value={
              statistics.available
            }
            icon={
              <CheckCircle2
                size={20}
              />
            }
            className="bg-green-50 text-green-700"
          />

          <MenuStat
            label="Low Stock"
            value={
              statistics.lowStock
            }
            icon={
              <AlertCircle
                size={20}
              />
            }
            className="bg-yellow-50 text-yellow-700"
          />

          <MenuStat
            label="Out of Stock"
            value={
              statistics.outOfStock
            }
            icon={
              <XCircle size={20} />
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
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search food or category..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />

            </div>

            <div className="flex flex-wrap gap-2">

              <FilterButton
                active={
                  availabilityFilter ===
                  "all"
                }
                onClick={() =>
                  setAvailabilityFilter(
                    "all",
                  )
                }
              >
                All
              </FilterButton>

              <FilterButton
                active={
                  availabilityFilter ===
                  "available"
                }
                onClick={() =>
                  setAvailabilityFilter(
                    "available",
                  )
                }
              >
                Available
              </FilterButton>

              <FilterButton
                active={
                  availabilityFilter ===
                  "unavailable"
                }
                onClick={() =>
                  setAvailabilityFilter(
                    "unavailable",
                  )
                }
              >
                Unavailable
              </FilterButton>

            </div>

          </div>

        </section>

        {/* ====================================================
            MENU TABLE
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-bold text-[#24113f]">
                  Food Items
                </h2>

                <p className="mt-1 text-sm text-gray-400">

                  {filteredItems.length}{" "}
                  item
                  {filteredItems.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  shown

                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                <MenuIcon
                  size={19}
                />
              </div>

            </div>

          </div>

          {filteredItems.length ===
          0 ? (

            <div className="p-14 text-center">

              <MenuIcon
                size={44}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 font-semibold text-[#24113f]">
                No menu items found
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Try changing your search or add a new food item.
              </p>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
                disabled={
                  categories.length ===
                  0
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >

                <Plus size={17} />

                Add Item

              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      Item
                    </th>

                    <th className="px-6 py-4">
                      Category
                    </th>

                    <th className="px-6 py-4">
                      Price
                    </th>

                    <th className="px-6 py-4">
                      Stock
                    </th>

                    <th className="px-6 py-4">
                      Availability
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredItems.map(
                    (item) => {

                      const stock =
                        getItemStock(item);

                      const available =
                        getItemAvailability(
                          item,
                        );

                      const lowStock =
                        stock > 0 &&
                        stock <= 5;

                      const outOfStock =
                        stock <= 0;

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* ITEM */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-4">

                              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">

                                {item.image_url ? (
                                  <img
                                    src={
                                      item.image_url
                                    }
                                    alt={getItemName(
                                      item,
                                    )}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={
                                      22
                                    }
                                    className="text-gray-400"
                                  />
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="font-semibold text-[#24113f]">
                                  {getItemName(
                                    item,
                                  )}
                                </p>

                                {item.description && (
                                  <p className="mt-1 max-w-sm truncate text-xs text-gray-400">
                                    {
                                      item.description
                                    }
                                  </p>
                                )}

                              </div>

                            </div>

                          </td>

                          {/* CATEGORY */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-2">

                              <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#32145f]">
                                {getCategoryName(
                                  item.category_id,
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    "/admin/categories",
                                  )
                                }
                                className="text-xs font-semibold text-gray-400 hover:text-[#32145f]"
                                title="Manage categories"
                              >
                                Edit
                              </button>

                            </div>

                          </td>

                          {/* PRICE */}

                          <td className="px-6 py-5">

                            <span className="font-semibold text-[#32145f]">
                              ₹
                              {getItemPrice(
                                item,
                              ).toFixed(2)}
                            </span>

                          </td>

                          {/* STOCK */}

                          <td className="px-6 py-5">

                            {outOfStock ? (
                              <span className="font-semibold text-red-600">
                                0
                              </span>
                            ) : (
                              <div>

                                <span
                                  className={`font-semibold ${
                                    lowStock
                                      ? "text-yellow-700"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {
                                    stock
                                  }
                                </span>

                                {lowStock && (
                                  <p className="mt-1 text-xs text-yellow-600">
                                    Low stock
                                  </p>
                                )}

                              </div>
                            )}

                          </td>

                          {/* AVAILABILITY */}

                          <td className="px-6 py-5">

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleAvailability(
                                  item,
                                )
                              }
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                available
                                  ? "border-green-100 bg-green-50 text-green-700 hover:bg-green-100"
                                  : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >

                              {available ? (
                                <>
                                  <CheckCircle2
                                    size={
                                      14
                                    }
                                  />
                                  Available
                                </>
                              ) : (
                                <>
                                  <XCircle
                                    size={
                                      14
                                    }
                                  />
                                  Unavailable
                                </>
                              )}

                            </button>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    item,
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
                              >

                                <Edit3
                                  size={
                                    15
                                  }
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
                                  size={
                                    15
                                  }
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

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 p-6">

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  Menu Management
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#24113f]">
                  {editingItem
                    ? "Edit Menu Item"
                    : "Add Menu Item"}
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >

              <div className="grid gap-5 sm:grid-cols-2">

                {/* NAME */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Food Item Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "name",
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. Chicken Burger"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Description
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "description",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Describe the food item..."
                    rows={3}
                    disabled={saving}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                  />

                </div>

                {/* PRICE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Price
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.price
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          "price",
                          event.target
                            .value,
                        )
                      }
                      placeholder="0.00"
                      disabled={
                        saving
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-4 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                    />

                  </div>

                </div>

                {/* STOCK */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.stock
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "stock",
                        event.target
                          .value,
                      )
                    }
                    placeholder="0"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                  />

                </div>

                {/* CATEGORY */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Category
                  </label>

                  <div className="flex gap-2">

                    <select
                      value={
                        form.category_id
                      }
                      onChange={(
                        event,
                      ) =>
                        updateForm(
                          "category_id",
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        saving ||
                        categoriesLoading
                      }
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                    >

                      <option value="">
                        {categoriesLoading
                          ? "Loading categories..."
                          : "Select a category"}
                      </option>

                      {categories.map(
                        (
                          category,
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        ),
                      )}

                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/admin/categories",
                        )
                      }
                      className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-semibold text-[#32145f] hover:bg-purple-100"
                    >

                      <FolderTree
                        size={
                          16
                        }
                      />

                      Categories

                    </button>

                  </div>

                  {!categoriesLoading &&
                    categories.length ===
                      0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No categories available. Create one first.
                      </p>
                    )}

                </div>

                {/* IMAGE */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Image URL
                  </label>

                  <input
                    type="url"
                    value={
                      form.image_url
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "image_url",
                        event.target
                          .value,
                      )
                    }
                    placeholder="https://..."
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                  />

                </div>

                {/* AVAILABILITY */}

                <div className="sm:col-span-2">

                  <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">

                    <div>

                      <p className="text-sm font-semibold text-[#24113f]">
                        Available for customers
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Customers can order this item when enabled.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "is_available",
                          !form.is_available,
                        )
                      }
                      disabled={
                        saving
                      }
                      className={`relative h-7 w-12 rounded-full transition disabled:opacity-50 ${
                        form.is_available
                          ? "bg-[#32145f]"
                          : "bg-gray-300"
                      }`}
                    >

                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          form.is_available
                            ? "left-6"
                            : "left-1"
                        }`}
                      />

                    </button>

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    categories.length ===
                      0
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
                        size={
                          17
                        }
                      />

                      {editingItem
                        ? "Save Changes"
                        : "Create Item"}

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
   MENU STAT
============================================================ */

function MenuStat({
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
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[#32145f] text-white"
          : "border border-gray-200 bg-white text-gray-500 hover:border-purple-100 hover:text-[#32145f]"
      }`}
    >
      {children}
    </button>
  );
}