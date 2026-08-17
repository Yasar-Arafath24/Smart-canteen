import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getActivity,
  type ActivityLog,
} from "../../api/activity";


function formatTime(
  value: string,
) {
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


export default function AdminActivity() {
  const navigate = useNavigate();

  const [activities, setActivities] =
    useState<ActivityLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  async function loadActivities() {
    try {
      setError("");
      setRefreshing(true);

      const data =
        await getActivity();

      console.log(
        "ACTIVITY DATA:",
        data,
      );

      setActivities(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err: any) {
      console.error(
        "ACTIVITY FRONTEND ERROR:",
        err,
      );

      console.error(
        "STATUS:",
        err?.response?.status,
      );

      console.error(
        "RESPONSE:",
        err?.response?.data,
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load activity.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  useEffect(() => {
    loadActivities();
  }, []);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading activity...
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#fafafa]">

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white"
            >
              <ArrowLeft
                size={18}
              />
            </button>

            <div>

              <p className="text-sm text-purple-200">
                Administration
              </p>

              <h1 className="text-2xl font-bold text-white">
                System Activity
              </h1>

            </div>

          </div>

          <button
            type="button"
            onClick={loadActivities}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#32145f]"
          >
            <RefreshCw
              size={16}
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


      <main className="mx-auto max-w-5xl px-6 py-10">

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={18}
              />
              <span>{error}</span>
            </div>
          </div>
        )}


        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#32145f]">

                <Activity
                  size={21}
                />

              </div>

              <div>

                <h2 className="font-bold text-[#24113f]">
                  Recent Activity
                </h2>

                <p className="text-sm text-gray-400">
                  {activities.length}{" "}
                  records
                </p>

              </div>

            </div>

          </div>


          {activities.length ===
          0 ? (
            <div className="p-16 text-center">

              <Activity
                size={42}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 font-semibold text-gray-600">
                No activity yet
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Create an order or perform another action to generate activity.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {activities.map(
                (item) => (
                  <div
                    key={item.id}
                    className="p-6"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="font-semibold text-[#24113f]">
                          {
                            item.description
                          }
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">

                          {item.actor_name && (
                            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500">
                              By{" "}
                              {
                                item.actor_name
                              }
                            </span>
                          )}

                          {item.entity_type && (
                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs text-[#32145f]">
                              {
                                item.entity_type
                              }

                              {item.entity_id !=
                                null &&
                                ` #${item.entity_id}`}
                            </span>
                          )}

                          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500">
                            {
                              item.action
                            }
                          </span>

                        </div>

                      </div>

                      <span className="shrink-0 text-xs text-gray-400">
                        {formatTime(
                          item.created_at,
                        )}
                      </span>

                    </div>

                  </div>
                ),
              )}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}