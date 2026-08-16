import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getAllStaffAttendance,
  type AdminAttendance,
} from "../../api/AdminAttendance";


function formatDuration(
  seconds: number,
) {
  const hours = Math.floor(
    seconds / 3600,
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60,
  );

  return `${hours}h ${minutes}m`;
}


function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Still working";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


export default function AdminStaffAttendance() {
  const navigate = useNavigate();

  const [records, setRecords] =
    useState<AdminAttendance[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<
      "all" | "on-duty" | "off-duty"
    >("all");

  const [error, setError] =
    useState("");


  async function loadAttendance(
    initial = true,
  ) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data =
        await getAllStaffAttendance();

      setRecords(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err: any) {
      console.error(
        "Admin attendance error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load staff attendance.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  useEffect(() => {
    loadAttendance();

    const timer =
      window.setInterval(() => {
        loadAttendance(false);
      }, 10000);

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, []);


  const filteredRecords =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return records.filter(
        (record) => {
          const matchesSearch =
            !query ||
            record.staff_name
              .toLowerCase()
              .includes(query) ||
            record.staff_email
              ?.toLowerCase()
              .includes(query) ||
            String(
              record.staff_id,
            ).includes(query);

          const matchesFilter =
            filter === "all" ||
            (filter ===
              "on-duty" &&
              record.is_current) ||
            (filter ===
              "off-duty" &&
              !record.is_current);

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      records,
      search,
      filter,
    ]);


  const onDuty =
    records.filter(
      (record) =>
        record.is_current,
    ).length;

  const offDuty =
    records.filter(
      (record) =>
        !record.is_current,
    ).length;

  const totalHours =
    records.reduce(
      (total, record) =>
        total +
        record.worked_seconds,
      0,
    );


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading staff attendance...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* HEADER */}

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft size={18} />
            </button>

            <div>

              <p className="text-sm text-purple-200">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-white">
                Staff Attendance
              </h1>

              <p className="mt-1 text-sm text-purple-200">
                Monitor staff shifts and working hours.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              loadAttendance(false)
            }
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f] hover:bg-purple-50 disabled:opacity-50"
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

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">

            <AlertCircle size={19} />

            <div>{error}</div>

          </div>
        )}


        {/* SUMMARY */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <AttendanceStat
            icon={
              <UserCheck size={20} />
            }
            label="On Duty"
            value={onDuty}
            className="bg-green-50 text-green-700"
          />

          <AttendanceStat
            icon={
              <UserX size={20} />
            }
            label="Off Duty"
            value={offDuty}
            className="bg-gray-100 text-gray-500"
          />

          <AttendanceStat
            icon={
              <Clock size={20} />
            }
            label="Records"
            value={records.length}
          />

          <AttendanceStat
            icon={
              <CheckCircle2
                size={20}
              />
            }
            label="Logged Hours"
            value={`${Math.floor(
              totalHours / 3600,
            )}h`}
          />

        </section>


        {/* SEARCH / FILTER */}

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
                placeholder="Search staff name, email or ID..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
              />

            </div>


            <div className="flex flex-wrap gap-2">

              <FilterButton
                active={
                  filter === "all"
                }
                onClick={() =>
                  setFilter("all")
                }
              >
                All
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "on-duty"
                }
                onClick={() =>
                  setFilter("on-duty")
                }
              >
                On Duty
              </FilterButton>

              <FilterButton
                active={
                  filter ===
                  "off-duty"
                }
                onClick={() =>
                  setFilter("off-duty")
                }
              >
                Off Duty
              </FilterButton>

            </div>

          </div>

        </section>


        {/* TABLE */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <h2 className="font-bold text-[#24113f]">
              Attendance Records
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              {filteredRecords.length} records shown
            </p>

          </div>


          {filteredRecords.length ===
          0 ? (
            <div className="p-16 text-center">

              <Clock
                size={42}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 font-semibold text-gray-600">
                No attendance records found.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">

                    <th className="px-6 py-4">
                      Staff
                    </th>

                    <th className="px-6 py-4">
                      Clock In
                    </th>

                    <th className="px-6 py-4">
                      Clock Out
                    </th>

                    <th className="px-6 py-4">
                      Worked
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredRecords.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 font-bold text-[#32145f]">
                              {record.staff_name
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="font-semibold text-[#24113f]">
                                {
                                  record.staff_name
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {
                                  record.staff_email
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-300">
                                Staff #
                                {
                                  record.staff_id
                                }
                              </p>

                            </div>

                          </div>

                        </td>


                        <td className="px-6 py-5 text-sm text-gray-500">
                          {formatDateTime(
                            record.clock_in,
                          )}
                        </td>


                        <td className="px-6 py-5 text-sm text-gray-500">
                          {formatDateTime(
                            record.clock_out,
                          )}
                        </td>


                        <td className="px-6 py-5">

                          <span className="font-bold text-[#32145f]">
                            {formatDuration(
                              record.worked_seconds,
                            )}
                          </span>

                        </td>


                        <td className="px-6 py-5">

                          {record.is_current ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">

                              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                              On Duty

                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">

                              Off Duty

                            </span>
                          )}

                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>


        <div className="mt-8 flex gap-3">

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
              navigate(
                "/admin/users",
              )
            }
            className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-sm font-semibold text-[#32145f] hover:bg-purple-100"
          >
            Manage Staff
          </button>

        </div>

      </main>

    </div>
  );
}


/* ============================================================
   STAT
============================================================ */

function AttendanceStat({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
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
   FILTER
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
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
        active
          ? "bg-[#32145f] text-white"
          : "border border-gray-200 bg-white text-gray-500 hover:border-purple-100 hover:text-[#32145f]"
      }`}
    >
      {children}
    </button>
  );
}