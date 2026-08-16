import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAllUsers,
  updateUser,
  type AdminUser,
} from "../../api/admin";

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ============================================================
     LOAD USERS
  ============================================================ */

  async function loadUsers() {
    try {
      setError("");

      const data = await getAllUsers();

      setUsers(data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to load customers.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  /* ============================================================
     REFRESH
  ============================================================ */

  async function handleRefresh() {
    setRefreshing(true);
    await loadUsers();
  }

  /* ============================================================
     UPDATE USER STATUS
  ============================================================ */

  async function handleToggleActive(user: AdminUser) {
    /*
      Prevent changing an admin account accidentally.
      You can remove this check later if you want admins
      to be able to deactivate other admin accounts.
    */
    if (user.role.toLowerCase() === "admin") {
      setError(
        "Admin accounts cannot be activated or deactivated from this page.",
      );
      setSuccess("");
      return;
    }

    try {
      setUpdatingId(user.id);
      setError("");
      setSuccess("");

      const updatedUser = await updateUser(user.id, {
        is_active: !user.is_active,
      });

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? updatedUser
            : currentUser,
        ),
      );

      setSuccess(
        `${updatedUser.name} has been ${
          updatedUser.is_active
            ? "activated"
            : "deactivated"
        }.`,
      );
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to update user status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /* ============================================================
     UPDATE ROLE
  ============================================================ */

  async function handleRoleChange(
    user: AdminUser,
    newRole: string,
  ) {
    if (user.role.toLowerCase() === "admin") {
      setError(
        "Admin accounts cannot have their role changed from this page.",
      );
      setSuccess("");
      return;
    }

    if (newRole === user.role) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError("");
      setSuccess("");

      const updatedUser = await updateUser(user.id, {
        role: newRole,
      });

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? updatedUser
            : currentUser,
        ),
      );

      setSuccess(
        `${updatedUser.name}'s role has been changed to ${updatedUser.role}.`,
      );
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to update user role.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /* ============================================================
     FILTER USERS
  ============================================================ */

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        user.role.toLowerCase() ===
          roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  /* ============================================================
     STATISTICS
  ============================================================ */

  const statistics = useMemo(() => {
    const active = users.filter(
      (user) => user.is_active,
    ).length;

    const inactive = users.filter(
      (user) => !user.is_active,
    ).length;

    const admins = users.filter(
      (user) =>
        user.role.toLowerCase() === "admin",
    ).length;

    const customers = users.filter(
      (user) =>
        user.role.toLowerCase() === "customer",
    ).length;

    return {
      total: users.length,
      active,
      inactive,
      admins,
      customers,
    };
  }, [users]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading customers...
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="rounded-xl border border-white/25 bg-white/10 p-2.5 text-purple-100 transition hover:bg-white/20 hover:text-white"
              title="Back to admin dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-xs font-medium text-purple-200">
                Administration
              </p>

              <h1 className="text-xl font-bold text-white">
                Customer Management
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* ======================================================
            HEADING
        ====================================================== */}

        <div className="mb-8">
          <p className="text-sm font-medium text-[#32145f]">
            Customers
          </p>

          <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
            Manage Customers
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            View registered users and manage their account
            status and roles.
          </p>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ======================================================
            SUCCESS
        ====================================================== */}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-sm text-green-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<UserCheck size={21} />}
            label="Total Users"
            value={statistics.total}
          />

          <StatCard
            icon={<CheckCircle2 size={21} />}
            label="Active"
            value={statistics.active}
          />

          <StatCard
            icon={<UserX size={21} />}
            label="Inactive"
            value={statistics.inactive}
          />

          <StatCard
            icon={<ShieldCheck size={21} />}
            label="Admins"
            value={statistics.admins}
          />
        </div>

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
            {/* Search */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-2 focus:ring-purple-50"
              />
            </div>

            {/* Role */}

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#32145f]"
            >
              <option value="all">
                All Roles
              </option>

              <option value="customer">
                Customers
              </option>

              <option value="admin">
                Admins
              </option>
            </select>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#32145f]"
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-600">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-600">
              {users.length}
            </span>{" "}
            users
          </div>
        </section>

        {/* ======================================================
            USERS TABLE
        ====================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h3 className="font-bold text-[#24113f]">
              Registered Users
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Manage customer accounts and permissions.
            </p>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <UsersEmpty />

              <p className="mt-4 text-sm text-gray-400">
                No users match your search.
              </p>

              {(search ||
                roleFilter !== "all" ||
                statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                  className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      User
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Role
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Registered
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const isAdmin =
                      user.role.toLowerCase() ===
                      "admin";

                    const isUpdating =
                      updatingId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                      >
                        {/* USER */}

                        <td className="px-6 py-5">
                          <div>
                            <p className="font-semibold text-[#24113f]">
                              {user.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                              {user.email}
                            </p>

                            <p className="mt-1 text-xs text-gray-300">
                              User ID: #{user.id}
                            </p>
                          </div>
                        </td>

                        {/* ROLE */}

                        <td className="px-6 py-5">
                          {isAdmin ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#32145f]">
                              <ShieldCheck size={14} />
                              Admin
                            </div>
                          ) : (
                            <select
                              value={user.role}
                              disabled={isUpdating}
                              onChange={(event) =>
                                handleRoleChange(
                                  user,
                                  event.target.value,
                                )
                              }
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#32145f] disabled:opacity-50"
                            >
                              <option value="customer">
                                Customer
                              </option>

                              <option value="admin">
                                Admin
                              </option>
                            </select>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              user.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                user.is_active
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />

                            {user.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* DATE */}

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-500">
                            {new Date(
                              user.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">
                          {isAdmin ? (
                            <span className="text-xs font-medium text-gray-400">
                              Protected
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                handleToggleActive(
                                  user,
                                )
                              }
                              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                user.is_active
                                  ? "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                                  : "border border-green-100 bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : user.is_active ? (
                                <UserX size={16} />
                              ) : (
                                <UserCheck size={16} />
                              )}

                              {user.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ======================================================
            BACK BUTTONS
        ====================================================== */}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-purple-100 hover:text-[#32145f]"
          >
            Back to Admin Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/orders")
            }
            className="rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a]"
          >
            Manage Orders
          </button>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
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
   EMPTY STATE ICON
============================================================ */

function UsersEmpty() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
      <UserCheck size={30} />
    </div>
  );
}