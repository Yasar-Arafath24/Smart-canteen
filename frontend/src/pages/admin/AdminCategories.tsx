import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  FolderTree,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";

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

interface CategoryForm {
  name: string;
  description: string;
}

const emptyForm: CategoryForm = {
  name: "",
  description: "",
};

/* ============================================================
   API
============================================================ */

async function getCategories(): Promise<Category[]> {
  const response =
    await api.get<Category[]>("/categories/");

  return response.data;
}

async function getMenuItems(): Promise<MenuItem[]> {
  const response =
    await api.get<MenuItem[]>("/menu/");

  return response.data;
}

async function createCategory(
  data: CategoryForm,
): Promise<Category> {
  const response =
    await api.post<Category>(
      "/categories/",
      {
        name: data.name.trim(),
        description:
          data.description.trim() || null,
      },
    );

  return response.data;
}

async function updateCategory(
  categoryId: number,
  data: CategoryForm,
): Promise<Category> {
  const response =
    await api.put<Category>(
      `/categories/${categoryId}`,
      {
        name: data.name.trim(),
        description:
          data.description.trim() || null,
      },
    );

  return response.data;
}

async function deleteCategory(
  categoryId: number,
): Promise<void> {
  await api.delete(
    `/categories/${categoryId}`,
  );
}

async function assignFoodToCategory(
  itemId: number,
  categoryId: number,
): Promise<MenuItem> {
  const response =
    await api.put<MenuItem>(
      `/menu/${itemId}`,
      {
        category_id: categoryId,
      },
    );

  return response.data;
}

/* ============================================================
   ADMIN CATEGORIES
============================================================ */

export default function AdminCategories() {
  const navigate = useNavigate();

  /* ==========================================================
     DATA
  ========================================================== */

  const [categories, setCategories] =
    useState<Category[]>([]);

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
     FORM
  ========================================================== */

  const [showForm, setShowForm] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] =
    useState<CategoryForm>(
      emptyForm,
    );

  const [saving, setSaving] =
    useState(false);

  /* ==========================================================
     FOOD ASSIGNMENT
  ========================================================== */

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<number | null>(null);

  const [showAddFood, setShowAddFood] =
    useState(false);

  const [selectedFoodId, setSelectedFoodId] =
    useState<number | null>(null);

  const [assigningFood, setAssigningFood] =
    useState(false);

  /* ==========================================================
     EXPANDED CATEGORY
  ========================================================== */

  const [expandedCategories, setExpandedCategories] =
    useState<number[]>([]);

  /* ==========================================================
     SEARCH
  ========================================================== */

  const [search, setSearch] =
    useState("");

  /* ==========================================================
     ALERTS
  ========================================================== */

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  async function loadData(
    showLoader = true,
  ) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [
        categoriesData,
        menuData,
      ] = await Promise.all([
        getCategories(),
        getMenuItems(),
      ]);

      setCategories(
        Array.isArray(
          categoriesData,
        )
          ? categoriesData
          : [],
      );

      setMenuItems(
        Array.isArray(menuData)
          ? menuData
          : [],
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load categories and menu items.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadData(false);
  }

  /* ==========================================================
     CATEGORY FOOD GROUPS
  ========================================================== */

  const categoryFoods = useMemo(() => {
    const grouped: Record<
      number,
      MenuItem[]
    > = {};

    categories.forEach(
      (category) => {
        grouped[category.id] = [];
      },
    );

    menuItems.forEach((item) => {
      if (
        item.category_id &&
        grouped[item.category_id]
      ) {
        grouped[item.category_id].push(
          item,
        );
      }
    });

    return grouped;
  }, [categories, menuItems]);

  /* ==========================================================
     FILTERED CATEGORIES
  ========================================================== */

  const filteredCategories =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return categories;
      }

      return categories.filter(
        (category) =>
          category.name
            .toLowerCase()
            .includes(query) ||
          category.description
            ?.toLowerCase()
            .includes(query),
      );
    }, [categories, search]);

  /* ==========================================================
     UNASSIGNED / AVAILABLE FOODS
  ========================================================== */

  const availableFoods = useMemo(() => {
    if (
      selectedCategoryId === null
    ) {
      return [];
    }

    return menuItems.filter(
      (item) =>
        item.category_id !==
        selectedCategoryId,
    );
  }, [
    menuItems,
    selectedCategoryId,
  ]);

  /* ==========================================================
     EXPAND / COLLAPSE
  ========================================================== */

  function toggleCategory(
    categoryId: number,
  ) {
    setExpandedCategories(
      (current) =>
        current.includes(categoryId)
          ? current.filter(
              (id) =>
                id !== categoryId,
            )
          : [...current, categoryId],
    );
  }

  /* ==========================================================
     CATEGORY FORM
  ========================================================== */

  function openCreateForm() {
    setEditingCategory(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    category: Category,
  ) {
    setEditingCategory(category);

    setForm({
      name: category.name,
      description:
        category.description || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingCategory(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof CategoryForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ==========================================================
     SAVE CATEGORY
  ========================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    setError("");
    setSuccess("");

    if (!name) {
      setError(
        "Category name is required.",
      );
      return;
    }

    if (name.length < 2) {
      setError(
        "Category name must contain at least 2 characters.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        description,
      };

      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          payload,
        );

        setSuccess(
          `"${name}" updated successfully.`,
        );
      } else {
        await createCategory(
          payload,
        );

        setSuccess(
          `"${name}" created successfully.`,
        );
      }

      closeForm();

      await loadData(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     DELETE CATEGORY
  ========================================================== */

  async function handleDelete(
    category: Category,
  ) {
    const foods =
      categoryFoods[
        category.id
      ] || [];

    const message =
      foods.length > 0
        ? `"${category.name}" currently contains ${foods.length} food item(s). Are you sure you want to delete this category?`
        : `Are you sure you want to delete "${category.name}"?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError("");
      setSuccess("");

      await deleteCategory(
        category.id,
      );

      setSuccess(
        `"${category.name}" deleted successfully.`,
      );

      await loadData(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ==========================================================
     OPEN ADD FOOD
  ========================================================== */

  function openAddFood(
    categoryId: number,
  ) {
    setSelectedCategoryId(
      categoryId,
    );

    setSelectedFoodId(null);

    setError("");

    setShowAddFood(true);
  }

  function closeAddFood() {
    if (assigningFood) {
      return;
    }

    setShowAddFood(false);
    setSelectedFoodId(null);
    setSelectedCategoryId(null);
  }

  /* ==========================================================
     ASSIGN FOOD
  ========================================================== */

  async function handleAssignFood() {
    if (
      selectedCategoryId ===
        null ||
      selectedFoodId === null
    ) {
      setError(
        "Please select a food item.",
      );
      return;
    }

    const category =
      categories.find(
        (item) =>
          item.id ===
          selectedCategoryId,
      );

    const food =
      menuItems.find(
        (item) =>
          item.id ===
          selectedFoodId,
      );

    if (!category || !food) {
      setError(
        "Invalid category or food item.",
      );
      return;
    }

    try {
      setAssigningFood(true);

      setError("");
      setSuccess("");

      await assignFoodToCategory(
        food.id,
        category.id,
      );

      setSuccess(
        `${food.name} was added to ${category.name}.`,
      );

      closeAddFood();

      await loadData(false);

      if (
        !expandedCategories.includes(
          category.id,
        )
      ) {
        setExpandedCategories(
          (current) => [
            ...current,
            category.id,
          ],
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to assign food to category.",
      );
    } finally {
      setAssigningFood(false);
    }
  }

  /* ==========================================================
     MOVE FOOD
  ========================================================== */

  async function handleMoveFood(
    food: MenuItem,
    targetCategoryId: number,
  ) {
    if (
      food.category_id ===
      targetCategoryId
    ) {
      return;
    }

    const targetCategory =
      categories.find(
        (category) =>
          category.id ===
          targetCategoryId,
      );

    if (!targetCategory) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await assignFoodToCategory(
        food.id,
        targetCategoryId,
      );

      setSuccess(
        `${food.name} moved to ${targetCategory.name}.`,
      );

      await loadData(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to move food item.",
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

          Loading categories...
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
            >
              <ArrowLeft size={18} />
            </button>

            <div>

              <p className="text-sm font-medium text-[#32145f]">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#24113f]">
                Category Management
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Organize food items into menu categories.
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

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

            <button
              type="button"
              onClick={openCreateForm}
              className="flex items-center gap-2 rounded-xl bg-[#32145f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >

              <Plus size={18} />

              Add Category

            </button>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* ====================================================
            TITLE
        ==================================================== */}

        <section className="mb-8">

          <p className="text-sm font-medium text-[#32145f]">
            Categories
          </p>

          <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
            Food Categories
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Choose a category, see its food items, and add or move foods between categories.
          </p>

        </section>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle
              size={20}
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
            >
              <X size={18} />
            </button>

          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">

            <Check
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
              onClick={() =>
                setSuccess("")
              }
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <section className="mb-8">

          <div className="relative max-w-xl">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search categories..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-50"
            />

          </div>

        </section>

        {/* ====================================================
            CATEGORY CARDS
        ==================================================== */}

        {filteredCategories.length ===
        0 ? (

          <section className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-sm">

            <FolderTree
              size={45}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 font-bold text-[#24113f]">
              {categories.length ===
              0
                ? "No categories yet"
                : "No matching categories"}
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              {categories.length ===
              0
                ? "Create a category to start organizing your food."
                : "Try another search term."}
            </p>

            {categories.length ===
              0 && (
              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white"
              >
                <Plus size={18} />
                Create Category
              </button>
            )}

          </section>

        ) : (

          <div className="space-y-6">

            {filteredCategories.map(
              (category) => {

                const foods =
                  categoryFoods[
                    category.id
                  ] || [];

                const expanded =
                  expandedCategories.includes(
                    category.id,
                  );

                return (
                  <section
                    key={
                      category.id
                    }
                    className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                  >

                    {/* CATEGORY HEADER */}

                    <div className="flex flex-col gap-4 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">

                      <button
                        type="button"
                        onClick={() =>
                          toggleCategory(
                            category.id,
                          )
                        }
                        className="flex min-w-0 items-center gap-4 text-left"
                      >

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                          <FolderTree
                            size={22}
                          />
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-3">

                            <h3 className="text-xl font-bold text-[#24113f]">
                              {
                                category.name
                              }
                            </h3>

                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-[#32145f]">
                              {foods.length}{" "}
                              {foods.length ===
                              1
                                ? "food"
                                : "foods"}
                            </span>

                          </div>

                          <p className="mt-1 text-sm text-gray-400">
                            {category.description ||
                              "No description"}
                          </p>

                        </div>

                        {expanded ? (
                          <ChevronUp
                            size={20}
                            className="ml-auto text-gray-400 lg:ml-2"
                          />
                        ) : (
                          <ChevronDown
                            size={20}
                            className="ml-auto text-gray-400 lg:ml-2"
                          />
                        )}

                      </button>

                      <div className="flex flex-wrap items-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openAddFood(
                              category.id,
                            )
                          }
                          className="flex items-center gap-2 rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
                        >

                          <Plus
                            size={17}
                          />

                          Add Food

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              category,
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-purple-100 hover:bg-purple-50 hover:text-[#32145f]"
                          title="Edit category"
                        >
                          <Edit3
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              category,
                            )
                          }
                          disabled={
                            deletingId ===
                            category.id
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
                          title="Delete category"
                        >

                          {deletingId ===
                          category.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={16}
                            />
                          )}

                        </button>

                      </div>

                    </div>

                    {/* FOOD LIST */}

                    {expanded && (

                      <div className="p-6">

                        {foods.length ===
                        0 ? (

                          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">

                            <Store
                              size={36}
                              className="mx-auto text-gray-300"
                            />

                            <p className="mt-4 font-semibold text-gray-600">
                              No food items in this category
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                              Add an existing menu item to this category.
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openAddFood(
                                  category.id,
                                )
                              }
                              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white"
                            >

                              <Plus
                                size={17}
                              />

                              Add Food

                            </button>

                          </div>

                        ) : (

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                            {foods.map(
                              (food) => (
                                <FoodCard
                                  key={
                                    food.id
                                  }
                                  food={
                                    food
                                  }
                                  categories={
                                    categories
                                  }
                                  onMove={
                                    handleMoveFood
                                  }
                                />
                              ),
                            )}

                          </div>

                        )}

                      </div>

                    )}

                  </section>
                );
              },
            )}

          </div>

        )}

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="mt-8 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:border-purple-100 hover:text-[#32145f]"
          >
            <ArrowLeft size={17} />
            Admin Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/menu")
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] hover:bg-purple-100"
          >
            Manage Menu
          </button>

        </div>

      </main>

      {/* ======================================================
          CREATE / EDIT CATEGORY MODAL
      ====================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  Category Management
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#24113f]">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              <div className="space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Category Name
                  </label>

                  <input
                    type="text"
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        "name",
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. Burgers"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-50 disabled:bg-gray-50"
                  />

                </div>

                <div>

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
                    placeholder="Describe this category..."
                    rows={4}
                    disabled={saving}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-50 disabled:bg-gray-50"
                  />

                </div>

              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#421b7a] disabled:opacity-50"
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
                      <Check
                        size={17}
                      />
                      {editingCategory
                        ? "Update Category"
                        : "Create Category"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================
          ADD FOOD MODAL
      ====================================================== */}

      {showAddFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  Add Food to Category
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#24113f]">

                  {categories.find(
                    (category) =>
                      category.id ===
                      selectedCategoryId,
                  )?.name ||
                    "Category"}

                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeAddFood
                }
                disabled={
                  assigningFood
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            <div className="p-6">

              <p className="mb-4 text-sm text-gray-500">
                Select an existing menu food to add to this category.
              </p>

              {availableFoods.length ===
              0 ? (

                <div className="rounded-2xl bg-gray-50 p-8 text-center">

                  <Store
                    size={35}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-4 font-semibold text-gray-600">
                    No other menu items available
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Create a food item from Menu Management first.
                  </p>

                </div>

              ) : (

                <div className="max-h-80 space-y-2 overflow-y-auto">

                  {availableFoods.map(
                    (food) => {

                      const selected =
                        selectedFoodId ===
                        food.id;

                      return (
                        <button
                          type="button"
                          key={
                            food.id
                          }
                          onClick={() =>
                            setSelectedFoodId(
                              food.id,
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-[#32145f] bg-purple-50"
                              : "border-gray-200 bg-white hover:border-purple-100 hover:bg-purple-50/50"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            {food.image_url ? (
                              <img
                                src={
                                  food.image_url
                                }
                                alt={
                                  food.name
                                }
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                                <Store
                                  size={19}
                                />
                              </div>
                            )}

                            <div>

                              <p className="font-semibold text-[#24113f]">
                                {
                                  food.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                ₹
                                {Number(
                                  food.price,
                                ).toFixed(
                                  2,
                                )}
                              </p>

                            </div>

                          </div>

                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[#32145f] bg-[#32145f] text-white"
                                : "border-gray-300"
                            }`}
                          >

                            {selected && (
                              <Check
                                size={
                                  14
                                }
                              />
                            )}

                          </div>

                        </button>
                      );
                    },
                  )}

                </div>

              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeAddFood
                  }
                  disabled={
                    assigningFood
                  }
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleAssignFood
                  }
                  disabled={
                    assigningFood ||
                    selectedFoodId ===
                      null
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {assigningFood ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={17}
                      />
                      Add Food
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* ============================================================
   FOOD CARD
============================================================ */

function FoodCard({
  food,
  categories,
  onMove,
}: {
  food: MenuItem;
  categories: Category[];
  onMove: (
    food: MenuItem,
    categoryId: number,
  ) => void;
}) {
  const [moveOpen, setMoveOpen] =
    useState(false);

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

      <div className="flex items-start gap-4">

        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-[#32145f]">
            <Store size={22} />
          </div>
        )}

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div>

              <h4 className="font-bold text-[#24113f]">
                {food.name}
              </h4>

              <p className="mt-1 text-sm text-[#32145f]">
                ₹
                {Number(
                  food.price,
                ).toFixed(2)}
              </p>

            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                food.stock === 0
                  ? "bg-red-50 text-red-600"
                  : food.stock <= 5
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-green-50 text-green-700"
              }`}
            >
              {food.stock ===
              0
                ? "Out"
                : food.stock <= 5
                  ? `${food.stock} left`
                  : "In stock"}
            </span>

          </div>

          <div className="mt-3 flex items-center justify-between">

            <span className="text-xs text-gray-400">
              {food.is_available
                ? "Available"
                : "Unavailable"}
            </span>

            <button
              type="button"
              onClick={() =>
                setMoveOpen(
                  !moveOpen,
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-purple-100 hover:bg-purple-50 hover:text-[#32145f]"
            >
              Move
            </button>

          </div>

        </div>

      </div>

      {moveOpen && (
        <div className="mt-4 border-t border-gray-200 pt-4">

          <p className="mb-2 text-xs font-semibold text-gray-500">
            Move to category
          </p>

          <select
            value=""
            onChange={(event) => {
              const categoryId =
                Number(
                  event.target.value,
                );

              if (
                categoryId > 0
              ) {
                onMove(
                  food,
                  categoryId,
                );

                setMoveOpen(
                  false,
                );
              }
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-200 focus:ring-2 focus:ring-purple-50"
          >

            <option
              value=""
              disabled
            >
              Select category
            </option>

            {categories
              .filter(
                (category) =>
                  category.id !==
                  food.category_id,
              )
              .map(
                (category) => (
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

        </div>
      )}

    </div>
  );
}