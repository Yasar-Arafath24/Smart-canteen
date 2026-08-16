import {
  BarChart3,
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { logout } from "../api/auth";
import { useCart } from "../context/CartContext";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const CUSTOMER_LINKS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Cart",
    to: "/cart",
    icon: <ShoppingCart size={18} />,
  },
  {
    label: "My Orders",
    to: "/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Notifications",
    to: "/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Profile",
    to: "/profile",
    icon: <User size={18} />,
  },
];

const ADMIN_LINKS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Orders",
    to: "/admin/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: <Users size={18} />,
  },
  {
    label: "Menu",
    to: "/admin/menu",
    icon: <Utensils size={18} />,
  },
  {
    label: "Inventory",
    to: "/admin/inventory",
    icon: <Package size={18} />,
  },
  {
    label: "Analytics",
    to: "/admin/analytics",
    icon: <BarChart3 size={18} />,
  },
];

function Navbar({ role }: { role: "customer" | "admin" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);

  const links = role === "customer" ? CUSTOMER_LINKS : ADMIN_LINKS;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function isActive(to: string) {
    if (to === "/admin") {
      return location.pathname === "/admin";
    }

    return location.pathname.startsWith(to);
  }

  function handleLogout() {
    setMobileOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() =>
            navigate(role === "customer" ? "/dashboard" : "/admin")
          }
          className="flex shrink-0 items-center gap-2.5 text-left"
          title="SmartCanteen"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32145f] text-white">
            <UtensilsCrossed size={18} />
          </span>

          <span>
            <span className="block text-sm font-extrabold tracking-tight text-[#24113f]">
              SmartCanteen
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-gray-400">
              {role === "customer" ? "Customer" : "Admin"} Portal
            </span>
          </span>
        </button>

        {/* Links (desktop) */}
        <nav className="hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
          {links.map((link) => {
            const active = isActive(link.to);

            return (
              <button
                key={link.to}
                type="button"
                onClick={() => navigate(link.to)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-purple-50 text-[#32145f]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-[#32145f]"
                }`}
              >
                {link.icon}

                <span>{link.label}</span>

                {link.to === "/cart" && totalItems > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#32145f] px-1 text-[10px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Logout (desktop) */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100 md:flex"
            title="Logout"
          >
            <LogOut size={17} />

            <span>Logout</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-purple-100 hover:text-[#32145f] md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const active = isActive(link.to);

              return (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => navigate(link.to)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-purple-50 text-[#32145f]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#32145f]"
                  }`}
                >
                  {link.icon}

                  <span>{link.label}</span>

                  {link.to === "/cart" && totalItems > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#32145f] px-1 text-[10px] font-bold text-white">
                      {totalItems > 99 ? "99+" : totalItems}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="my-2 border-t border-gray-100" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              <LogOut size={18} />

              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;