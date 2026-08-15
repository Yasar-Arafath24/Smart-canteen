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
} from "lucide-react";

import { getMenuItems, type MenuItem } from "../../api/menu";
import { logout } from "../../api/auth";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const { totalItems, addToCart } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMenu() {
      try {
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

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center px-7">
          <div>
            <h1 className="text-xl font-bold text-[#32145f]">
              SmartCanteen
            </h1>
            <p className="text-xs text-gray-400">
              Food ordering
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <NavItem
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active
          />

          <NavItem
            icon={<Utensils size={19} />}
            label="Menu"
          />

          <NavItem
            icon={<ClipboardList size={19} />}
            label="My Orders"
          />

          <NavItem
            icon={<Bell size={19} />}
            label="Notifications"
          />

          <NavItem
            icon={<User size={19} />}
            label="Profile"
          />
        </nav>

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
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur md:px-10">
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
              <button
                className="relative rounded-xl border border-gray-100 bg-white p-3 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
                title="Notifications"
              >
                <Bell size={20} />
              </button>

              <button
                onClick={() => navigate("/cart")}
                className="relative rounded-xl border border-gray-100 bg-white p-3 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
                title="Cart"
              >
                <ShoppingCart size={20} />

                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#32145f] px-1 text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

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
              onChange={(event) =>
                setSearch(event.target.value)
              }
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

            {loading && (
              <div className="py-20 text-center text-sm text-gray-400">
                Loading menu...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                {error}
              </div>
            )}

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

            {!loading && !error && filteredItems.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function MenuCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  const unavailable =
    !item.is_available || item.stock <= 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-48 overflow-hidden bg-gray-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
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

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
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

          <button
            disabled={unavailable}
            onClick={() => onAdd(item)}
            className="flex items-center gap-2 rounded-xl bg-[#32145f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Plus size={17} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
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