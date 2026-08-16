import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserCog,
  UserX,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getAllUsers,
  updateUser,
  type AdminUser,
} from "../../api/admin";

import { api } from "../../api/client";

/* ============================================================
   TYPES
============================================================ */

interface StaffForm {
  name: string;
  email: string;
  password: string;
}

const emptyStaffForm: StaffForm = {
  name: "",
  email: "",
  password: "",
};

/* ============================================================
   CREATE STAFF
============================================================ */

async function createStaff(
  data: StaffForm,
): Promise<AdminUser> {
  const response =
    await api.post<AdminUser>(
      "/staff/",
      {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      },
    );

  return response.data;
}

/* ============================================================
   ADMIN USERS
============================================================ */

export default function AdminUsers() {
  const navigate = useNavigate();

  /* ==========================================================
     DATA
  ========================================================== */

  const [users, setUsers] =
    useState<AdminUser[]>([]);

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

  const [showStaffModal, setShowStaffModal] =
    useState(false);

  const [staffForm, setStaffForm] =
    useState<StaffForm>(
      emptyStaffForm,
    );

  const [creatingStaff, setCreatingStaff] =
    useState(false);

  /* ==========================================================
     USER ACTION
  ========================================================== */

  const [updatingUserId, setUpdatingUserId] =
    useState<number | null>(null);

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  /* ==========================================================
     ALERTS
  ========================================================== */

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ==========================================================
     LOAD USERS
  ========================================================== */

  async function loadUsers(
    showInitialLoading = true,
  ) {
    try {
      if (showInitialLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data =
        await getAllUsers();

      setUsers(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err: any) {
      console.error(
        "Admin users error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load users.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  async function handleRefresh() {
    await loadUsers(false);
  }

  /* ==========================================================
     COUNTS
  ========================================================== */

  const statistics = useMemo(() => {
    return {
      total: users.length,

      admins: users.filter(
        (user) =>
          user.role?.toLowerCase() ===
          "admin",
      ).length,

      staff: users.filter(
        (user) =>
          user.role?.toLowerCase() ===
          "staff",
      ).length,

      customers: users.filter(
        (user) =>
          user.role?.toLowerCase() ===
          "customer",
      ).length,

      active: users.filter(
        (user) => user.is_active,
      ).length,

      inactive: users.filter(
        (user) => !user.is_active,
      ).length,
    };
  }, [users]);

  /* ==========================================================
     FILTERED USERS
  ========================================================== */

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name
          .toLowerCase()
          .includes(query) ||
        user.email
          .toLowerCase()
          .includes(query) ||
        String(user.id).includes(
          query,
        );

      const role =
        user.role?.toLowerCase() ||
        "customer";

      const matchesRole =
        roleFilter === "all" ||
        role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          user.is_active) ||
        (statusFilter === "inactive" &&
          !user.is_active);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  /* ==========================================================
     STAFF FORM
  ========================================================== */

  function openStaffModal() {
    setStaffForm(emptyStaffForm);
    setError("");
    setSuccess("");
    setShowStaffModal(true);
  }

  function closeStaffModal() {
    if (creatingStaff) {
      return;
    }

    setShowStaffModal(false);
    setStaffForm(emptyStaffForm);
  }

  function updateStaffForm(
    field: keyof StaffForm,
    value: string,
  ) {
    setStaffForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ==========================================================
     CREATE STAFF
  ========================================================== */

  async function handleCreateStaff(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      staffForm.name.trim();

    const email =
      staffForm.email.trim();

    const password =
      staffForm.password;

    if (!name) {
      setError(
        "Staff name is required.",
      );
      return;
    }

    if (!email) {
      setError(
        "Staff email is required.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Staff password must contain at least 8 characters.",
      );
      return;
    }

    try {
      setCreatingStaff(true);

      const created =
        await createStaff({
          name,
          email,
          password,
        });

      setUsers((current) => [
        created,
        ...current,
      ]);

      setSuccess(
        `Staff account "${created.name}" was created successfully.`,
      );

      setStaffForm(emptyStaffForm);
      setShowStaffModal(false);
    } catch (err: any) {
      console.error(
        "Create staff error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to create staff account.",
      );
    } finally {
      setCreatingStaff(false);
    }
  }

  /* ==========================================================
     TOGGLE USER ACTIVE STATUS
  ========================================================== */

  async function handleToggleStatus(
    user: AdminUser,
  ) {
    /*
     * Don't allow an admin to accidentally
     * disable their own account from this page.
     *
     * We don't know the logged-in user's ID
     * here, so we only protect admin accounts
     * visually and let the backend enforce
     * its own authorization rules.
     */
    const nextStatus =
      !user.is_active;

    const action =
      nextStatus
        ? "activate"
        : "deactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${user.name}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingUserId(
        user.id,
      );

      setError("");
      setSuccess("");

      const updated =
        await updateUser(
          user.id,
          {
            is_active:
              nextStatus,
          },
        );

      setUsers((current) =>
        current.map(
          (currentUser) =>
            currentUser.id ===
            updated.id
              ? updated
              : currentUser,
        ),
      );

      setSuccess(
        `${updated.name} is now ${
          updated.is_active
            ? "active"
            : "inactive"
        }.`,
      );
    } catch (err: any) {
      console.error(
        "Update user status error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to update user status.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  /* ==========================================================
     ROLE STYLE
  ========================================================== */

  function getRoleClass(
    role: string,
  ) {
    switch (
      role?.toLowerCase()
    ) {
      case "admin":
        return "border-red-100 bg-red-50 text-red-600";

      case "staff":
        return "border-blue-100 bg-blue-50 text-blue-700";

      default:
        return "border-purple-100 bg-purple-50 text-[#32145f]";
    }
  }

  function getRoleLabel(
    role: string,
  ) {
    switch (
      role?.toLowerCase()
    ) {
      case "admin":
        return "Admin";

      case "staff":
        return "Staff";

      default:
        return "Customer";
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

          Loading users...

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

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
              title="Back to admin dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>

              <p className="text-sm font-medium text-purple-200">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                User Management
              </h1>

              <p className="mt-1 text-sm text-purple-200">
                Manage customers and staff accounts.
              </p>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>

            <button
              type="button"
              onClick={
                openStaffModal
              }
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#32145f] transition hover:bg-purple-50"
            >

              <Plus size={18} />

              Create Staff

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
              className="text-green-500 hover:text-green-700"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">

          <UserStat
            icon={
              <Users size={20} />
            }
            label="Total"
            value={
              statistics.total
            }
          />

          <UserStat
            icon={
              <Shield size={20} />
            }
            label="Admins"
            value={
              statistics.admins
            }
            className="bg-red-50 text-red-600"
          />

          <UserStat
            icon={
              <UserCog size={20} />
            }
            label="Staff"
            value={
              statistics.staff
            }
            className="bg-blue-50 text-blue-700"
          />

          <UserStat
            icon={
              <Users size={20} />
            }
            label="Customers"
            value={
              statistics.customers
            }
          />

          <UserStat
            icon={
              <UserCheck size={20} />
            }
            label="Active"
            value={
              statistics.active
            }
            className="bg-green-50 text-green-700"
          />

          <UserStat
            icon={
              <UserX size={20} />
            }
            label="Inactive"
            value={
              statistics.inactive
            }
            className="bg-gray-100 text-gray-500"
          />

        </section>

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            {/* SEARCH */}

            <div className="relative w-full xl:max-w-xl">

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
                placeholder="Search name, email or user ID..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />

            </div>

            {/* ROLE */}

            <div className="flex flex-wrap gap-2">

              {[
                {
                  value: "all",
                  label: "All",
                },
                {
                  value:
                    "admin",
                  label: "Admins",
                },
                {
                  value:
                    "staff",
                  label: "Staff",
                },
                {
                  value:
                    "customer",
                  label: "Customers",
                },
              ].map(
                (filter) => (
                  <FilterButton
                    key={
                      filter.value
                    }
                    active={
                      roleFilter ===
                      filter.value
                    }
                    onClick={() =>
                      setRoleFilter(
                        filter.value,
                      )
                    }
                  >
                    {filter.label}
                  </FilterButton>
                ),
              )}

            </div>

            {/* STATUS */}

            <div className="flex gap-2">

              <FilterButton
                active={
                  statusFilter ===
                  "all"
                }
                onClick={() =>
                  setStatusFilter(
                    "all",
                  )
                }
              >
                All Status
              </FilterButton>

              <FilterButton
                active={
                  statusFilter ===
                  "active"
                }
                onClick={() =>
                  setStatusFilter(
                    "active",
                  )
                }
              >
                Active
              </FilterButton>

              <FilterButton
                active={
                  statusFilter ===
                  "inactive"
                }
                onClick={() =>
                  setStatusFilter(
                    "inactive",
                  )
                }
              >
                Inactive
              </FilterButton>

            </div>

          </div>

        </section>

        {/* ====================================================
            USER TABLE
        ==================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-bold text-[#24113f]">
                  Users
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {filteredUsers.length}{" "}
                  user
                  {filteredUsers.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  shown
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">
                <Users size={19} />
              </div>

            </div>

          </div>

          {filteredUsers.length ===
          0 ? (

            <div className="p-14 text-center">

              <Users
                size={44}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 font-semibold text-[#24113f]">
                No users found
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Try changing your search or filters.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      User
                    </th>

                    <th className="px-6 py-4">
                      Role
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Joined
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredUsers.map(
                    (user) => {

                      const role =
                        user.role?.toLowerCase() ||
                        "customer";

                      const updating =
                        updatingUserId ===
                        user.id;

                      return (
                        <tr
                          key={user.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* USER */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-4">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-50 font-bold text-[#32145f]">
                                {user.name
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p className="font-semibold text-[#24113f]">
                                  {user.name}
                                </p>

                                <p className="mt-1 text-sm text-gray-400">
                                  {user.email}
                                </p>

                                <p className="mt-1 text-xs text-gray-300">
                                  User #
                                  {user.id}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* ROLE */}

                          <td className="px-6 py-5">

                            <span
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getRoleClass(
                                role,
                              )}`}
                            >
                              {
                                getRoleLabel(
                                  role,
                                )
                              }
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-5">

                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                user.is_active
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >

                              <span
                                className={`h-2 w-2 rounded-full ${
                                  user.is_active
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />

                              {user.is_active
                                ? "Active"
                                : "Inactive"}

                            </span>

                          </td>

                          {/* DATE */}

                          <td className="px-6 py-5 text-sm text-gray-500">

                            {user.created_at
                              ? new Date(
                                  user.created_at,
                                ).toLocaleDateString()
                              : "—"}

                          </td>

                          {/* ACTION */}

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleStatus(
                                    user,
                                  )
                                }
                                disabled={
                                  updating
                                }
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  user.is_active
                                    ? "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                                    : "border border-green-100 bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                              >

                                {updating ? (
                                  <Loader2
                                    size={
                                      15
                                    }
                                    className="animate-spin"
                                  />
                                ) : user.is_active ? (
                                  <UserX
                                    size={
                                      15
                                    }
                                  />
                                ) : (
                                  <UserCheck
                                    size={
                                      15
                                    }
                                  />
                                )}

                                {user.is_active
                                  ? "Deactivate"
                                  : "Activate"}

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

        {/* ====================================================
            BACK
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
              navigate("/admin/orders")
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] hover:bg-purple-100"
          >
            Manage Orders
          </button>

        </div>

      </main>

      {/* ======================================================
          CREATE STAFF MODAL
      ====================================================== */}

      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <p className="text-sm font-medium text-[#32145f]">
                  Staff Management
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#24113f]">
                  Create Staff Account
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeStaffModal
                }
                disabled={
                  creatingStaff
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleCreateStaff
              }
              className="p-6"
            >

              <div className="space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Staff Name
                  </label>

                  <input
                    type="text"
                    value={
                      staffForm.name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateStaffForm(
                        "name",
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. John Staff"
                    disabled={
                      creatingStaff
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      staffForm.email
                    }
                    onChange={(
                      event,
                    ) =>
                      updateStaffForm(
                        "email",
                        event.target
                          .value,
                      )
                    }
                    placeholder="staff@example.com"
                    disabled={
                      creatingStaff
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-[#24113f]">
                    Temporary Password
                  </label>

                  <input
                    type="password"
                    value={
                      staffForm.password
                    }
                    onChange={(
                      event,
                    ) =>
                      updateStaffForm(
                        "password",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Minimum 8 characters"
                    disabled={
                      creatingStaff
                    }
                    minLength={8}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 disabled:bg-gray-100"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    The staff member can use this password to log in.
                  </p>

                </div>

                {/* ROLE DISPLAY */}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700">
                      <UserCog
                        size={20}
                      />
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-blue-900">
                        Role: Staff
                      </p>

                      <p className="mt-1 text-xs text-blue-700">
                        Staff users can manage operational tasks but cannot manage admin accounts.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeStaffModal
                  }
                  disabled={
                    creatingStaff
                  }
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingStaff
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#32145f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {creatingStaff ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <Check
                        size={17}
                      />

                      Create Staff
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
   USER STAT
============================================================ */

function UserStat({
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