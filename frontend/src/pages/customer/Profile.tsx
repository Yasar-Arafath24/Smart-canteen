import {
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  LogOut,
  Save,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { logout } from "../../api/auth";

interface UserProfile {
  id: number;
  name?: string | null;
  email: string;
  role: string;
}

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      /*
       * Change this endpoint only if your backend
       * uses a different current-user endpoint.
       */
      const response = await api.get<UserProfile>("/users/me");

      setProfile(response.data);
      setName(response.data.name || "");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       * Change this endpoint if your backend has
       * a different profile update endpoint.
       */
      const response = await api.patch<UserProfile>(
        "/users/me",
        {
          name: name.trim(),
        },
      );

      setProfile(response.data);
      setName(response.data.name || "");

      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-gray-100 p-2.5 text-gray-500 transition hover:border-purple-100 hover:text-[#32145f]"
            title="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-xs font-medium text-gray-400">
              Account
            </p>

            <h1 className="text-xl font-bold text-[#24113f]">
              My Profile
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Heading */}
        <div className="mb-8">
          <p className="text-sm font-medium text-[#32145f]">
            Account settings
          </p>

          <h2 className="mt-1 text-3xl font-bold text-[#24113f]">
            Profile
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Manage your SmartCanteen account information.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Profile Card */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-50">
                <User
                  size={42}
                  className="text-[#32145f]"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#24113f]">
                {name || "Customer"}
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                {profile?.email}
              </p>

              <span className="mt-4 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#32145f]">
                {profile?.role || "customer"}
              </span>
            </div>
          </section>

          {/* Form */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <User
                  size={19}
                  className="text-[#32145f]"
                />
              </div>

              <div>
                <h3 className="font-bold text-[#24113f]">
                  Personal Information
                </h3>

                <p className="text-xs text-gray-400">
                  Update your account details
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-500 outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Email address cannot be changed here.
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Account Type
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
                  <ShieldCheck
                    size={18}
                    className="text-[#32145f]"
                  />

                  <span className="text-sm capitalize text-gray-600">
                    {profile?.role || "customer"}
                  </span>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="mt-7 flex justify-end border-t border-gray-100 pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Logout */}
        <section className="mt-6 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-[#24113f]">
                Sign out
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Sign out of your SmartCanteen account on this
                device.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}