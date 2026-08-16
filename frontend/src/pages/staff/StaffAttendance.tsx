import {
  Clock,
  History,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  clockIn,
  clockOut,
  getMyAttendanceHistory,
  getMyAttendanceStatus,
  type AttendanceRecord,
  type AttendanceStatus,
} from "../../api/StaffAttendance";

/* ============================================================
   HELPERS
============================================================ */

function formatClockTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "—";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(
    (seconds % 3600) / 60,
  );

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function secondsBetween(
  start: string,
  end: string | null,
) {
  const startDate = new Date(start);

  if (Number.isNaN(startDate.getTime())) {
    return 0;
  }

  const endDate = end
    ? new Date(end)
    : new Date();

  return Math.max(
    0,
    Math.floor(
      (endDate.getTime() - startDate.getTime()) /
        1000,
    ),
  );
}

function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
) {
  const detail =
    (error as any)?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  return fallback;
}

/* ============================================================
   STAFF ATTENDANCE
============================================================ */

export default function StaffAttendance() {
  const [status, setStatus] =
    useState<AttendanceStatus | null>(null);

  const [history, setHistory] =
    useState<AttendanceRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [acting, setActing] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* ==========================================================
     LOAD
  ========================================================== */

  const load = useCallback(
    async (initial = true) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const [statusData, historyData] =
          await Promise.all([
            getMyAttendanceStatus(),
            getMyAttendanceHistory(),
          ]);

        setStatus(statusData);
        setHistory(
          Array.isArray(historyData)
            ? historyData
            : [],
        );
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Could not load attendance",
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  /* ==========================================================
     CLOCK IN / OUT
  ========================================================== */

  async function handleClockIn() {
    setActing(true);
    setError("");
    setSuccess("");

    try {
      await clockIn();
      setSuccess(
        "Clocked in successfully",
      );

      await load(false);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not clock in",
        ),
      );
    } finally {
      setActing(false);
    }
  }

  async function handleClockOut() {
    setActing(true);
    setError("");
    setSuccess("");

    try {
      await clockOut();
      setSuccess(
        "Clocked out successfully",
      );

      await load(false);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not clock out",
        ),
      );
    } finally {
      setActing(false);
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  const isClockedIn = Boolean(
    status?.is_clocked_in,
  );

  const currentRecord = status?.attendance;

  const workedSeconds =
    status?.worked_seconds ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-[#24113f] bg-[#32145f]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-white">
              Attendance
            </h1>

            <p className="text-xs text-purple-200">
              Clock in and out for your shifts
            </p>
          </div>

          <button
            type="button"
            onClick={() => load(false)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#32145f] transition hover:bg-purple-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            <span>Refresh</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2
              size={28}
              className="animate-spin"
            />
          </div>
        ) : (
          <>
            {/* Status card */}
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isClockedIn
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Clock size={26} />
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        {isClockedIn
                          ? "Clocked In"
                          : "Not Clocked In"}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isClockedIn
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isClockedIn
                          ? "Active"
                          : "Off duty"}
                      </span>
                    </div>

                    {isClockedIn &&
                      currentRecord && (
                        <p className="mt-1 text-sm text-gray-500">
                          Clocked in at{" "}
                          <span className="font-semibold text-gray-700">
                            {formatClockTime(
                              currentRecord.clock_in,
                            )}
                          </span>{" "}
                          · worked{" "}
                          <span className="font-semibold text-gray-700">
                            {formatDuration(
                              workedSeconds,
                            )}
                          </span>{" "}
                          so far
                        </p>
                      )}

                    {!isClockedIn && (
                      <p className="mt-1 text-sm text-gray-500">
                        You are currently off
                        duty.
                      </p>
                    )}
                  </div>
                </div>

                {isClockedIn ? (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    disabled={acting}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {acting ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <LogOut size={16} />
                    )}

                    <span>Clock Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClockIn}
                    disabled={acting}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {acting ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <LogIn size={16} />
                    )}

                    <span>Clock In</span>
                  </button>
                )}
              </div>
            </section>

            {/* History */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
                <History
                  size={17}
                  className="text-[#32145f]"
                />

                <h3 className="text-sm font-bold text-gray-800">
                  My History
                </h3>
              </div>

              {history.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-gray-400">
                  No attendance records yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                        <th className="px-6 py-3 font-semibold">
                          Date
                        </th>

                        <th className="px-6 py-3 font-semibold">
                          Clock In
                        </th>

                        <th className="px-6 py-3 font-semibold">
                          Clock Out
                        </th>

                        <th className="px-6 py-3 font-semibold">
                          Duration
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-6 py-3.5 font-medium text-gray-800">
                            {formatDate(
                              record.clock_in,
                            )}
                          </td>

                          <td className="px-6 py-3.5 text-gray-600">
                            {formatClockTime(
                              record.clock_in,
                            )}
                          </td>

                          <td className="px-6 py-3.5 text-gray-600">
                            {record.clock_out
                              ? formatClockTime(
                                  record.clock_out,
                                )
                              : "—"}
                          </td>

                          <td className="px-6 py-3.5 font-semibold text-gray-700">
                            {formatDuration(
                              secondsBetween(
                                record.clock_in,
                                record.clock_out,
                              ),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}