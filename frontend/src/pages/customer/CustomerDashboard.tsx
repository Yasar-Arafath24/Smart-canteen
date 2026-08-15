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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getMenuItems, type MenuItem } from "../../api/menu";
import { logout } from "../../api/auth";
import { useCart } from "../../context/CartContext";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const {
    items: cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
  } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const data = await getMenuItems();
        setMenuItems(data);
      } catch {
        setError("Unable to load the menu.");
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return menuItems;
    }

    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    );
  }, [menuItems, search]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleNavigation(label: string) {
    setActiveNav(label);

    if (label === "Dashboard" || label === "Menu") {
      if (window.location.pathname !== "/dashboard") {
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
      window.alert("Profile section will be available soon.");
    }
  }

  function getCartQuantity(itemId: number) {
    const cartItem = cartItems.find(
      (cartItem) => cartItem.item.id === itemId,
    );

    return cartItem?.quantity ?? 0;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center px-7">
          <button
            onClick={() => handleNavigation("Dashboard")}
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

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <NavItem
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active={activeNav === "Dashboard"}
            onClick={() => handleNavigation("Dashboard")}
          />

          <NavItem
            icon={<Utensils size={19} />}
            label="Menu"
            active={activeNav === "Menu"}
            onClick={() => handleNavigation("Menu")}
          />

          <NavItem
            icon={<ClipboardList size={19} />}
            label="My Orders"
            active={activeNav === "My Orders"}
            onClick={() => handleNavigation("My Orders")}
          />

          <NavItem
            icon={<Bell size={19} />}
            label="Notifications"
            active={activeNav === "Notifications"}
            onClick={() => handleNavigation("Notifications")}
          />

          <NavItem
            icon={<User size={19} />}
            label="Profile"
            active={activeNav === "Profile"}
            onClick={() => handleNavigation("Profile")}
          />
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-[#32145f]"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur md:px-10">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm text-gray-400">
                Customer Dashboard
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#24113f]">
                What would you like to eat?
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                onClick={() => handleNavigation("Notifications")}
                className="relative rounded-xl border border-gray-100 bg-white p-3 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
                title="Notifications"
              >
                <Bell size={20} />
              </button>

              {/* Cart */}
              <button
                onClick={() => navigate("/cart")}
                className="relative rounded-xl border border-gray-100 bg-white p-3 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
                title="Cart"
              >
                <ShoppingCart size={20} />

                {totalItems > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#32145f] px-1 text-[10px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 py-8 md:px-10">
          {/* Search */}
          <div className="relative max-w-xl">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search meals..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100"
            />
          </div>

          {/* Menu */}
          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-medium text-[#32145f]">
                  Available now
                </p>

                <h3 className="mt-1 text-2xl font-bold text-[#24113f]">
                  Today's Menu
                </h3>
              </div>

              <span className="text-sm text-gray-400">
                {filteredItems.length} items
              </span>
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
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
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Empty */}
            {!loading &&
              !error &&
              filteredItems.length === 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center">
                  <Utensils
                    size={32}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-4 font-medium text-gray-600">
                    No meals found
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Try another search.
                  </p>
                </div>
              )}

            {/* Menu Cards */}
            {!loading &&
              !error &&
              filteredItems.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      quantity={getCartQuantity(item.id)}
                      onAdd={() => addToCart(item)}
                      onIncrease={() => increaseQuantity(item.id)}
                      onDecrease={() => decreaseQuantity(item.id)}
                    />
                  ))}
                </div>
              )}
          </section>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white px-3 py-2 lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          <MobileNavItem
            icon={<LayoutDashboard size={19} />}
            label="Home"
            active={activeNav === "Dashboard"}
            onClick={() => handleNavigation("Dashboard")}
          />

          <MobileNavItem
            icon={<ClipboardList size={19} />}
            label="Orders"
            active={activeNav === "My Orders"}
            onClick={() => handleNavigation("My Orders")}
          />

          <MobileNavItem
            icon={<ShoppingCart size={19} />}
            label="Cart"
            active={false}
            badge={totalItems}
            onClick={() => navigate("/cart")}
          />

          <MobileNavItem
            icon={<User size={19} />}
            label="Profile"
            active={activeNav === "Profile"}
            onClick={() => handleNavigation("Profile")}
          />
        </div>
      </div>
    </div>
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
    !item.is_available || item.stock <= 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Image */}
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

      {/* Content */}
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
            ₹{item.price.toFixed(2)}
          </span>
        </div>

        {/* Availability */}
        <div className="mt-5 flex items-center justify-between">
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

          {/* Add / Quantity Controls */}
          {unavailable ? (
            <button
              disabled
              className="rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-400"
            >
              Unavailable
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
            >
              <Plus size={17} />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-xl bg-purple-50 p-1">
              <button
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
                onClick={onIncrease}
                disabled={quantity >= item.stock}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#32145f] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Added message */}
        {quantity > 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-600">
            <Check size={14} />
            {quantity} added to cart
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   SIDEBAR NAV ITEM
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
   MOBILE NAV ITEM
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
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>

      <span className="mt-1">{label}</span>
    </button>
  );
}