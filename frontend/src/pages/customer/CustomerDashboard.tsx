import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  User,
  Utensils,
  Plus,
  Minus,
  Check,
  FolderTree,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getMenuItems, type MenuItem } from "../../api/menu";
import { logout } from "../../api/auth";
import { useCart } from "../../context/CartContext";
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

/* ============================================================
   CUSTOMER DASHBOARD
============================================================ */

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const {
    items: cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
  } = useCart();

  /* ==========================================================
     DATA
  ========================================================== */

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState<number | null>(null);

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loading, setLoading] =
    useState(true);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  /* ==========================================================
     ERROR
  ========================================================== */

  const [error, setError] =
    useState("");

  const [categoryError, setCategoryError] =
    useState("");

  /* ==========================================================
     NAV
  ========================================================== */

  const [activeNav, setActiveNav] =
    useState("Dashboard");

  /* ==========================================================
     LOAD MENU + CATEGORIES
  ========================================================== */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setCategoriesLoading(true);

        setError("");
        setCategoryError("");

        const [
          menuData,
          categoryResponse,
        ] = await Promise.all([
          getMenuItems(),
          api.get<Category[]>(
            "/categories/",
          ),
        ]);

        setMenuItems(menuData);
        setCategories(
          Array.isArray(
            categoryResponse.data,
          )
            ? categoryResponse.data
            : [],
        );
      } catch (err: any) {
        console.error(
          "Customer dashboard load error:",
          err,
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load the menu.",
        );

        setCategoryError(
          "Unable to load categories.",
        );
      } finally {
        setLoading(false);
        setCategoriesLoading(false);
      }
    }

    loadData();
  }, []);

  /* ==========================================================
     FILTERED MENU
  ========================================================== */

  const filteredItems = useMemo(() => {
    const query =
      search.toLowerCase().trim();

    return menuItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.name
          .toLowerCase()
          .includes(query) ||
        item.description
          ?.toLowerCase()
          .includes(query);

      const matchesCategory =
        activeCategory === null ||
        item.category_id === activeCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    menuItems,
    search,
    activeCategory,
  ]);

  /* ==========================================================
     CATEGORY COUNTS
  ========================================================== */

  const categoryCounts =
    useMemo(() => {
      const counts: Record<
        number,
        number
      > = {};

      menuItems.forEach((item) => {
        counts[item.category_id] =
          (counts[item.category_id] ||
            0) + 1;
      });

      return counts;
    }, [menuItems]);

  /* ==========================================================
     LOGOUT
  ========================================================== */

  function handleLogout() {
    logout();
    navigate("/login");
  }

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  function handleNavigation(
    label: string,
  ) {
    setActiveNav(label);

    if (
      label === "Dashboard" ||
      label === "Menu"
    ) {
      if (
        window.location.pathname !==
        "/dashboard"
      ) {
        navigate("/dashboard");
      }

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);

      return;
    }

    if (label === "My Orders") {
      navigate("/orders");
      return;
    }

    if (label === "Notifications") {
      navigate("/notifications");
      return;
    }

    if (label === "Profile") {
      navigate("/profile");
      return;
    }
  }

  /* ==========================================================
     CART QUANTITY
  ========================================================== */

  function getCartQuantity(
    itemId: number,
  ) {
    const cartItem =
      cartItems.find(
        (cartItem) =>
          cartItem.item.id ===
          itemId,
      );

    return cartItem?.quantity ?? 0;
  }

  /* ==========================================================
     CATEGORY SELECTION
  ========================================================== */

  function handleCategoryChange(
    categoryId: number | null,
  ) {
    setActiveCategory(categoryId);

    setTimeout(() => {
      const menuSection =
        document.getElementById(
          "customer-menu",
        );

      menuSection?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  /* ==========================================================
     RESET FILTERS
  ========================================================== */

  function clearFilters() {
    setSearch("");
    setActiveCategory(null);
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-100 bg-white lg:flex lg:flex-col">

        {/* LOGO */}

        <div className="flex h-20 items-center px-7">

          <button
            type="button"
            onClick={() =>
              handleNavigation(
                "Dashboard",
              )
            }
            className="text-left"
          >

            <h1 className="text-xl font-bold text-[#32145f]">
              SmartCanteen
            </h1>

            <p className="text-xs text-gray-400">
              Food ordering
            </p>

          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 py-6">

          <NavItem
            icon={
              <LayoutDashboard
                size={19}
              />
            }
            label="Dashboard"
            active={
              activeNav ===
              "Dashboard"
            }
            onClick={() =>
              handleNavigation(
                "Dashboard",
              )
            }
          />

          <NavItem
            icon={
              <Utensils size={19} />
            }
            label="Menu"
            active={
              activeNav === "Menu"
            }
            onClick={() =>
              handleNavigation(
                "Menu",
              )
            }
          />

          <NavItem
            icon={
              <ClipboardList
                size={19}
              />
            }
            label="My Orders"
            active={
              activeNav ===
              "My Orders"
            }
            onClick={() =>
              handleNavigation(
                "My Orders",
              )
            }
          />

          <NavItem
            icon={
              <Bell size={19} />
            }
            label="Notifications"
            active={
              activeNav ===
              "Notifications"
            }
            onClick={() =>
              handleNavigation(
                "Notifications",
              )
            }
          />

          <NavItem
            icon={
              <User size={19} />
            }
            label="Profile"
            active={
              activeNav === "Profile"
            }
            onClick={() =>
              handleNavigation(
                "Profile",
              )
            }
          />

        </nav>

        {/* LOGOUT */}

        <div className="border-t border-gray-100 p-4">

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-[#32145f]"
          >

            <LogOut size={19} />

            Logout

          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="lg:ml-64">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="sticky top-0 z-20 border-b border-[#24113f] bg-[#32145f]/95 px-6 py-5 backdrop-blur md:px-10">

          <div className="flex items-center justify-between gap-6">

            <div>

              <p className="text-sm text-purple-200">
                Customer Dashboard
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">
                What would you like to eat?
              </h2>

            </div>

            <div className="flex items-center gap-3">

              {/* NOTIFICATIONS */}

              <button
                type="button"
                onClick={() =>
                  handleNavigation(
                    "Notifications",
                  )
                }
                className="relative rounded-xl border border-white/25 bg-white/10 p-3 text-purple-100 transition hover:bg-white/20 hover:text-white"
                title="Notifications"
              >
                <Bell size={20} />
              </button>

              {/* CART */}

              <button
                type="button"
                onClick={() =>
                  navigate("/cart")
                }
                className="relative rounded-xl border border-white/25 bg-white/10 p-3 text-purple-100 transition hover:bg-white/20 hover:text-white"
                title="Cart"
              >

                <ShoppingCart
                  size={20}
                />

                {totalItems > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#32145f]">
                    {totalItems >
                    99
                      ? "99+"
                      : totalItems}
                  </span>
                )}

              </button>

            </div>

          </div>

        </header>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="px-6 py-8 pb-28 md:px-10">

          {/* SEARCH */}

          <div className="relative max-w-xl">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search meals..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100"
            />

          </div>

          {/* ==================================================
              CATEGORIES
          ================================================== */}

          <section className="mt-8">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  Browse by category
                </p>

                <h3 className="mt-1 text-xl font-bold text-[#24113f]">
                  Categories
                </h3>

              </div>

              {(search ||
                activeCategory !==
                  null) && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="text-sm font-semibold text-[#32145f] hover:underline"
                >
                  Clear filters
                </button>
              )}

            </div>

            {/* CATEGORY ERROR */}

            {categoryError &&
              !categoriesLoading && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {categoryError}
                </div>
              )}

            {/* CATEGORY LOADING */}

            {categoriesLoading ? (

              <div className="flex gap-3 overflow-x-auto pb-2">

                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-11 w-28 shrink-0 animate-pulse rounded-xl bg-gray-200"
                    />
                  ),
                )}

              </div>

            ) : (

              <div className="flex gap-3 overflow-x-auto pb-2">

                {/* ALL */}

                <CategoryButton
                  name="All"
                  count={menuItems.length}
                  active={
                    activeCategory ===
                    null
                  }
                  onClick={() =>
                    handleCategoryChange(
                      null,
                    )
                  }
                  icon={
                    <Utensils
                      size={17}
                    />
                  }
                />

                {/* CATEGORIES */}

                {categories.map(
                  (category) => (
                    <CategoryButton
                      key={
                        category.id
                      }
                      name={
                        category.name
                      }
                      count={
                        categoryCounts[
                          category.id
                        ] || 0
                      }
                      active={
                        activeCategory ===
                        category.id
                      }
                      onClick={() =>
                        handleCategoryChange(
                          category.id,
                        )
                      }
                      icon={
                        <FolderTree
                          size={17}
                        />
                      }
                    />
                  ),
                )}

              </div>

            )}

          </section>

          {/* ==================================================
              MENU
          ================================================== */}

          <section
            id="customer-menu"
            className="mt-10 scroll-mt-28"
          >

            <div className="mb-5 flex items-end justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  Available now
                </p>

                <h3 className="mt-1 text-2xl font-bold text-[#24113f]">

                  {activeCategory ===
                  null
                    ? "Today's Menu"
                    : categories.find(
                        (category) =>
                          category.id ===
                          activeCategory,
                      )?.name ||
                      "Today's Menu"}

                </h3>

              </div>

              <span className="shrink-0 text-sm text-gray-400">
                {filteredItems.length}{" "}
                {filteredItems.length ===
                1
                  ? "item"
                  : "items"}
              </span>

            </div>

            {/* ACTIVE FILTER */}

            {(search ||
              activeCategory !==
                null) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">

                {search && (
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                    Search: "
                    {search}"
                  </span>
                )}

                {activeCategory !==
                  null && (
                  <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#32145f]">
                    Category:{" "}
                    {categories.find(
                      (category) =>
                        category.id ===
                        activeCategory,
                    )?.name ||
                      "Selected"}
                  </span>
                )}

              </div>
            )}

            {/* LOADING */}

            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
                    >

                      <div className="h-48 animate-pulse bg-gray-100" />

                      <div className="space-y-3 p-5">

                        <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />

                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />

                        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />

                        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100" />

                      </div>

                    </div>
                  ),
                )}

              </div>
            )}

            {/* ERROR */}

            {!loading &&
              error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                  {error}
                </div>
              )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              filteredItems.length ===
                0 && (
                <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center">

                  <Utensils
                    size={32}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-4 font-medium text-gray-600">
                    {search ||
                    activeCategory !==
                      null
                      ? "No meals match your filters"
                      : "No meals found"}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {search ||
                    activeCategory !==
                      null
                      ? "Try another category or search term."
                      : "The canteen menu is currently empty."}
                  </p>

                  {(search ||
                    activeCategory !==
                      null) && (
                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="mt-5 rounded-xl bg-[#32145f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
                    >
                      Show All Meals
                    </button>
                  )}

                </div>
              )}

            {/* MENU CARDS */}

            {!loading &&
              !error &&
              filteredItems.length >
                0 && (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

                  {filteredItems.map(
                    (item) => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        quantity={getCartQuantity(
                          item.id,
                        )}
                        onAdd={() =>
                          addToCart(item)
                        }
                        onIncrease={() =>
                          increaseQuantity(
                            item.id,
                          )
                        }
                        onDecrease={() =>
                          decreaseQuantity(
                            item.id,
                          )
                        }
                      />
                    ),
                  )}

                </div>
              )}

          </section>

        </div>

      </main>

      {/* ======================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white px-3 py-2 lg:hidden">

        <div className="grid grid-cols-4 gap-2">

          <MobileNavItem
            icon={
              <LayoutDashboard
                size={19}
              />
            }
            label="Home"
            active={
              activeNav ===
              "Dashboard"
            }
            onClick={() =>
              handleNavigation(
                "Dashboard",
              )
            }
          />

          <MobileNavItem
            icon={
              <ClipboardList
                size={19}
              />
            }
            label="Orders"
            active={
              activeNav ===
              "My Orders"
            }
            onClick={() =>
              handleNavigation(
                "My Orders",
              )
            }
          />

          <MobileNavItem
            icon={
              <ShoppingCart
                size={19}
              />
            }
            label="Cart"
            active={false}
            badge={totalItems}
            onClick={() =>
              navigate("/cart")
            }
          />

          <MobileNavItem
            icon={
              <User size={19} />
            }
            label="Profile"
            active={
              activeNav === "Profile"
            }
            onClick={() =>
              handleNavigation(
                "Profile",
              )
            }
          />

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   CATEGORY BUTTON
============================================================ */

function CategoryButton({
  name,
  count,
  active,
  icon,
  onClick,
}: {
  name: string;
  count: number;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-[#32145f] bg-[#32145f] text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-purple-100 hover:bg-purple-50 hover:text-[#32145f]"
      }`}
    >

      {icon}

      <span>
        {name}
      </span>

      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          active
            ? "bg-white/20 text-white"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>

    </button>
  );
}

/* ============================================================
   MENU CARD
============================================================ */

function MenuCard({
  item,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const unavailable =
    !item.is_available ||
    item.stock <= 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      {/* IMAGE */}

      <div className="h-48 overflow-hidden bg-gray-100">

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Utensils
              size={40}
              className="text-gray-300"
            />
          </div>
        )}

      </div>

      {/* CONTENT */}

      <div className="p-5">

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <h4 className="font-bold text-[#24113f]">
              {item.name}
            </h4>

            {item.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
                {item.description}
              </p>
            )}

          </div>

          <span className="shrink-0 font-bold text-[#32145f]">
            ₹
            {Number(
              item.price,
            ).toFixed(2)}
          </span>

        </div>

        {/* AVAILABILITY */}

        <div className="mt-5 flex items-center justify-between gap-4">

          <span
            className={`text-xs font-medium ${
              unavailable
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {unavailable
              ? "Unavailable"
              : `${item.stock} available`}
          </span>

          {/* ADD */}

          {unavailable ? (

            <button
              type="button"
              disabled
              className="rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-400"
            >
              Unavailable
            </button>

          ) : quantity === 0 ? (

            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-2 rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >
              <Plus size={17} />
              Add
            </button>

          ) : (

            <div className="flex items-center gap-1 rounded-xl bg-purple-50 p-1">

              <button
                type="button"
                onClick={onDecrease}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#32145f] transition hover:bg-white"
                title="Decrease quantity"
              >
                <Minus size={15} />
              </button>

              <span className="flex min-w-8 items-center justify-center text-sm font-bold text-[#32145f]">
                {quantity}
              </span>

              <button
                type="button"
                onClick={
                  onIncrease
                }
                disabled={
                  quantity >=
                  item.stock
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#32145f] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Increase quantity"
              >
                <Plus size={15} />
              </button>

            </div>

          )}

        </div>

        {/* ADDED */}

        {quantity > 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-600">

            <Check size={14} />

            {quantity}{" "}
            {quantity === 1
              ? "item"
              : "items"}{" "}
            added to cart

          </div>
        )}

      </div>

    </article>
  );
}

/* ============================================================
   SIDEBAR NAV
============================================================ */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-purple-50 text-[#32145f]"
          : "text-gray-500 hover:bg-gray-50 hover:text-[#32145f]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ============================================================
   MOBILE NAV
============================================================ */

function MobileNavItem({
  icon,
  label,
  active = false,
  badge = 0,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-[11px] font-medium transition ${
        active
          ? "bg-purple-50 text-[#32145f]"
          : "text-gray-400 hover:text-[#32145f]"
      }`}
    >

      <div className="relative">

        {icon}

        {badge > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#32145f] px-1 text-[9px] font-bold text-white">
            {badge > 9
              ? "9+"
              : badge}
          </span>
        )}

      </div>

      <span className="mt-1">
        {label}
      </span>

    </button>
  );
}