import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  Clock,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Tags,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { logout } from "../api/auth";
import { useCart } from "../context/CartContext";


/* ============================================================
   TYPES
============================================================ */

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}


/* ============================================================
   CUSTOMER LINKS
   CUSTOMER NAVIGATION STAYS THE SAME
============================================================ */

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


/* ============================================================
   ADMIN PRIMARY LINKS
============================================================ */

const ADMIN_PRIMARY_LINKS: NavItem[] = [
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
];


/* ============================================================
   ADMIN MORE LINKS
============================================================ */

const ADMIN_MORE_LINKS: NavItem[] = [
  {
    label: "Inventory",
    to: "/admin/inventory",
    icon: <Package size={18} />,
  },
  {
    label: "Menu",
    to: "/admin/menu",
    icon: <Utensils size={18} />,
  },
  {
    label: "Categories",
    to: "/admin/categories",
    icon: <Tags size={18} />,
  },
  {
    label: "Staff Attendance",
    to: "/admin/staff-attendance",
    icon: <Clock size={18} />,
  },
  {
    label: "Analytics",
    to: "/admin/analytics",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Activity",
    to: "/admin/activity",
    icon: <Activity size={18} />,
  },
];


/* ============================================================
   STAFF PRIMARY LINKS
============================================================ */

const STAFF_PRIMARY_LINKS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/staff",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Orders",
    to: "/staff/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Inventory",
    to: "/staff/inventory",
    icon: <Package size={18} />,
  },
];


/* ============================================================
   STAFF MORE LINKS
============================================================ */

const STAFF_MORE_LINKS: NavItem[] = [
  {
    label: "Attendance",
    to: "/staff/attendance",
    icon: <Clock size={18} />,
  },
  {
    label: "Notifications",
    to: "/staff/notifications",
    icon: <Bell size={18} />,
  },
  {
    label: "Profile",
    to: "/staff/profile",
    icon: <User size={18} />,
  },
];


/* ============================================================
   NAVBAR
============================================================ */

function Navbar({
  role,
}: {
  role: "customer" | "admin" | "staff";
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const { totalItems } = useCart();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [moreOpen, setMoreOpen] =
    useState(false);


  /* ==========================================================
     PRIMARY LINKS
  ========================================================== */

  const primaryLinks =
    role === "customer"
      ? CUSTOMER_LINKS
      : role === "admin"
        ? ADMIN_PRIMARY_LINKS
        : STAFF_PRIMARY_LINKS;


  /* ==========================================================
     MORE LINKS
  ========================================================== */

  const moreLinks =
    role === "admin"
      ? ADMIN_MORE_LINKS
      : role === "staff"
        ? STAFF_MORE_LINKS
        : [];


  /* ==========================================================
     CLOSE MENUS WHEN ROUTE CHANGES
  ========================================================== */

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);


  /* ==========================================================
     ACTIVE LINK
  ========================================================== */

  function isActive(to: string) {
    if (to === "/admin") {
      return location.pathname === "/admin";
    }

    if (to === "/staff") {
      return location.pathname === "/staff";
    }

    return location.pathname.startsWith(to);
  }


  /* ==========================================================
     MORE ACTIVE
  ========================================================== */

  const moreIsActive =
    role !== "customer" &&
    moreLinks.some((link) =>
      isActive(link.to),
    );


  /* ==========================================================
     LOGOUT
  ========================================================== */

  function handleLogout() {
    setMobileOpen(false);
    setMoreOpen(false);

    logout();

    navigate("/login");
  }


  /* ==========================================================
     HOME PATH
  ========================================================== */

  function getHomePath() {
    if (role === "customer") {
      return "/dashboard";
    }

    if (role === "admin") {
      return "/admin";
    }

    return "/staff";
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">

      {/* ======================================================
          IMPORTANT:
          Full-width container so SmartCanteen aligns left.
      ====================================================== */}

      <div className="flex h-16 w-full items-center justify-between gap-4 px-6">

        {/* ====================================================
            BRAND
        ==================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate(
              getHomePath(),
            )
          }
          className="flex shrink-0 items-center gap-2.5 text-left"
          title="SmartCanteen"
        >

          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32145f] text-white">
            <UtensilsCrossed
              size={18}
            />
          </span>

          <span>

            <span className="block text-sm font-extrabold tracking-tight text-[#24113f]">
              SmartCanteen
            </span>

            <span className="block text-[10px] font-medium uppercase tracking-widest text-gray-400">
              {role === "customer"
                ? "Customer"
                : role === "admin"
                  ? "Admin"
                  : "Staff"}{" "}
              Portal
            </span>

          </span>

        </button>


        {/* ====================================================
            DESKTOP NAVIGATION
        ==================================================== */}

        <nav className="hidden min-w-0 items-center gap-1 md:flex">

          {/* --------------------------------------------------
              PRIMARY LINKS
          -------------------------------------------------- */}

          {primaryLinks.map(
            (link) => {
              const active =
                isActive(
                  link.to,
                );

              return (
                <button
                  key={link.to}
                  type="button"
                  onClick={() =>
                    navigate(
                      link.to,
                    )
                  }
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-purple-50 text-[#32145f]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#32145f]"
                  }`}
                >

                  {link.icon}

                  <span>
                    {link.label}
                  </span>

                  {link.to ===
                    "/cart" &&
                    totalItems >
                      0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#32145f] px-1 text-[10px] font-bold text-white">
                        {totalItems >
                        99
                          ? "99+"
                          : totalItems}
                      </span>
                    )}

                </button>
              );
            },
          )}


          {/* --------------------------------------------------
              ADMIN / STAFF MORE MENU
          -------------------------------------------------- */}

          {role !== "customer" && (
            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setMoreOpen(
                    (open) =>
                      !open,
                  )
                }
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  moreIsActive
                    ? "bg-purple-50 text-[#32145f]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-[#32145f]"
                }`}
                aria-haspopup="menu"
                aria-expanded={
                  moreOpen
                }
              >

                <Menu
                  size={18}
                />

                <span>
                  More
                </span>

                <ChevronDown
                  size={15}
                  className={`transition-transform ${
                    moreOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </button>


              {moreOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">

                  {moreLinks.map(
                    (link) => (
                      <button
                        key={
                          link.to
                        }
                        type="button"
                        onClick={() => {
                          navigate(
                            link.to,
                          );

                          setMoreOpen(
                            false,
                          );
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          isActive(
                            link.to,
                          )
                            ? "bg-purple-50 text-[#32145f]"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#32145f]"
                        }`}
                      >

                        {link.icon}

                        <span>
                          {
                            link.label
                          }
                        </span>

                      </button>
                    ),
                  )}

                </div>
              )}

            </div>
          )}

        </nav>


        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="flex shrink-0 items-center gap-2">

          {/* --------------------------------------------------
              DESKTOP LOGOUT
          -------------------------------------------------- */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="hidden items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100 md:flex"
            title="Logout"
          >

            <LogOut
              size={17}
            />

            <span>
              Logout
            </span>

          </button>


          {/* --------------------------------------------------
              MOBILE MENU BUTTON
          -------------------------------------------------- */}

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (open) =>
                  !open,
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-purple-100 hover:text-[#32145f] md:hidden"
            aria-label={
              mobileOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={
              mobileOpen
            }
          >

            {mobileOpen ? (
              <X size={20} />
            ) : (
              <Menu
                size={20}
              />
            )}

          </button>

        </div>

      </div>


      {/* ====================================================
          MOBILE MENU
      ==================================================== */}

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">

          <nav className="flex flex-col gap-1">

            {/* ------------------------------------------------
                PRIMARY LINKS
            ------------------------------------------------ */}

            {primaryLinks.map(
              (link) => (
                <button
                  key={link.to}
                  type="button"
                  onClick={() =>
                    navigate(
                      link.to,
                    )
                  }
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive(
                      link.to,
                    )
                      ? "bg-purple-50 text-[#32145f]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#32145f]"
                  }`}
                >

                  {link.icon}

                  <span>
                    {link.label}
                  </span>

                  {link.to ===
                    "/cart" &&
                    totalItems >
                      0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#32145f] px-1 text-[10px] font-bold text-white">
                        {totalItems >
                        99
                          ? "99+"
                          : totalItems}
                      </span>
                    )}

                </button>
              ),
            )}


            {/* ------------------------------------------------
                ADMIN / STAFF MORE
            ------------------------------------------------ */}

            {role !== "customer" && (
              <>
                <div className="my-2 border-t border-gray-100" />

                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  More
                </p>

                {moreLinks.map(
                  (link) => (
                    <button
                      key={
                        link.to
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          link.to,
                        )
                      }
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        isActive(
                          link.to,
                        )
                          ? "bg-purple-50 text-[#32145f]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#32145f]"
                      }`}
                    >

                      {link.icon}

                      <span>
                        {
                          link.label
                        }
                      </span>

                    </button>
                  ),
                )}
              </>
            )}


            {/* ------------------------------------------------
                MOBILE LOGOUT
            ------------------------------------------------ */}

            <div className="my-2 border-t border-gray-100" />

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >

              <LogOut
                size={18}
              />

              <span>
                Logout
              </span>

            </button>

          </nav>

        </div>
      )}

    </header>
  );
}


export default Navbar;