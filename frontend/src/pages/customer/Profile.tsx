import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  api,
} from "../../api/client";

import {
  logout,
} from "../../api/auth";


/* ============================================================
   TYPES
============================================================ */

interface UserProfile {
  id: number;
  name?: string | null;
  email: string;
  role: string;
}


/* ============================================================
   PROFILE PAGE
============================================================ */

export default function Profile() {
  const navigate = useNavigate();


  /* ==========================================================
     PROFILE STATE
  ========================================================== */

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [name, setName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /* ==========================================================
     PASSWORD STATE
  ========================================================== */

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");


  /* ==========================================================
     LOAD PROFILE
  ========================================================== */

  useEffect(() => {
    void loadProfile();
  }, []);


  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<UserProfile>(
          "/users/me",
        );

      setProfile(response.data);

      setName(
        response.data.name ?? "",
      );
    } catch (err: any) {
      console.error(
        "Load profile error:",
        err,
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }


  /* ==========================================================
     SAVE PROFILE
  ========================================================== */

  async function handleSave() {
    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        "Name cannot be empty.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await api.patch<UserProfile>(
          "/users/me",
          {
            name: trimmedName,
          },
        );

      setProfile(response.data);

      setName(
        response.data.name ?? "",
      );

      setSuccess(
        "Profile updated successfully.",
      );
    } catch (err: any) {
      console.error(
        "Update profile error:",
        err,
      );

      const detail =
        err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item?.msg || "Validation error",
            )
            .join(", "),
        );
      } else {
        setError(
          detail ||
            "Unable to update your profile.",
        );
      }
    } finally {
      setSaving(false);
    }
  }


  /* ==========================================================
     CHANGE PASSWORD
  ========================================================== */

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordSuccess("");

    /* --------------------------------------------------------
       Required fields
    -------------------------------------------------------- */

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields.",
      );
      return;
    }


    /* --------------------------------------------------------
       Minimum length
    -------------------------------------------------------- */

    if (
      newPassword.length < 8
    ) {
      setPasswordError(
        "New password must be at least 8 characters.",
      );
      return;
    }


    /* --------------------------------------------------------
       Confirm password
    -------------------------------------------------------- */

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "New password and confirmation do not match.",
      );
      return;
    }


    /* --------------------------------------------------------
       Must be different
    -------------------------------------------------------- */

    if (
      currentPassword ===
      newPassword
    ) {
      setPasswordError(
        "New password must be different from your current password.",
      );
      return;
    }


    try {
      setChangingPassword(true);


      /* ======================================================
         IMPORTANT:
         Backend expects JSON:

         {
           current_password: "...",
           new_password: "..."
         }
      ====================================================== */

      const response =
        await api.post<{
          message: string;
        }>(
          "/auth/change-password",
          {
            current_password:
              currentPassword,

            new_password:
              newPassword,
          },
        );


      /* ------------------------------------------------------
         Clear fields after success
      ------------------------------------------------------ */

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");


      setPasswordSuccess(
        response.data?.message ||
          "Password changed successfully.",
      );

    } catch (err: any) {
      console.error(
        "Change password error:",
        err,
      );

      const detail =
        err?.response?.data?.detail;


      /* ------------------------------------------------------
         FastAPI validation errors
      ------------------------------------------------------ */

      if (Array.isArray(detail)) {
        setPasswordError(
          detail
            .map(
              (item: any) =>
                item?.msg ||
                "Validation error",
            )
            .join(", "),
        );

        return;
      }


      /* ------------------------------------------------------
         Normal backend error
      ------------------------------------------------------ */

      setPasswordError(
        typeof detail === "string"
          ? detail
          : "Unable to change your password.",
      );

    } finally {
      setChangingPassword(false);
    }
  }


  /* ==========================================================
     LOGOUT
  ========================================================== */

  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
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

          Loading your profile...

        </div>

      </div>
    );
  }


  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="border-b border-[#24113f] bg-[#32145f]">

        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard",
              )
            }
            className="rounded-xl border border-white/25 bg-white/10 p-2.5 text-purple-100 transition hover:bg-white/20 hover:text-white"
            title="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </button>


          <div>

            <p className="text-xs font-medium text-purple-200">
              Account
            </p>

            <h1 className="text-xl font-bold text-white">
              My Profile
            </h1>

          </div>

        </div>

      </header>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* ==================================================
            HEADING
        ================================================== */}

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


        {/* ==================================================
            GENERAL ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}


        {/* ==================================================
            GENERAL SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}


        {/* ==================================================
            PROFILE + PERSONAL INFORMATION
        ================================================== */}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* =================================================
              PROFILE CARD
          ================================================= */}

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


          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

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

              {/* NAME */}

              <div>

                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your name"
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div>

                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="profile-email"
                    type="email"
                    value={
                      profile?.email || ""
                    }
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-500 outline-none"
                  />

                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Email address cannot be changed here.
                </p>

              </div>


              {/* ROLE */}

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
                    {profile?.role ||
                      "customer"}
                  </span>

                </div>

              </div>

            </div>


            {/* SAVE */}

            <div className="mt-7 flex justify-end border-t border-gray-100 pt-6">

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
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
                    <Save
                      size={17}
                    />
                    Save Changes
                  </>
                )}

              </button>

            </div>

          </section>

        </div>


        {/* ==================================================
            CHANGE PASSWORD
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">

              <ShieldCheck
                size={19}
                className="text-[#32145f]"
              />

            </div>

            <div>

              <h3 className="font-bold text-[#24113f]">
                Change Password
              </h3>

              <p className="text-xs text-gray-400">
                Keep your account secure with a strong password.
              </p>

            </div>

          </div>


          {/* PASSWORD ERROR */}

          {passwordError && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {passwordError}
            </div>
          )}


          {/* PASSWORD SUCCESS */}

          {passwordSuccess && (
            <div className="mt-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
              {passwordSuccess}
            </div>
          )}


          {/* PASSWORD FORM */}

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <PasswordField
              id="current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrentPassword}
              setShow={setShowCurrentPassword}
              disabled={changingPassword}
              autoComplete="current-password"
              placeholder="Enter current password"
            />


            <PasswordField
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNewPassword}
              setShow={setShowNewPassword}
              disabled={changingPassword}
              autoComplete="new-password"
              placeholder="Enter new password"
            />


            <PasswordField
              id="confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
              disabled={changingPassword}
              autoComplete="new-password"
              placeholder="Confirm new password"
            />

          </div>


          {/* CHANGE PASSWORD BUTTON */}

          <div className="mt-7 flex justify-end border-t border-gray-100 pt-6">

            <button
              type="button"
              onClick={
                handleChangePassword
              }
              disabled={
                changingPassword
              }
              className="flex items-center gap-2 rounded-xl bg-[#32145f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {changingPassword ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Changing...
                </>
              ) : (
                <>
                  <Lock
                    size={17}
                  />
                  Change Password
                </>
              )}

            </button>

          </div>

        </section>


        {/* ==================================================
            LOGOUT
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-bold text-[#24113f]">
                Sign out
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Sign out of your SmartCanteen account on this device.
              </p>

            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >

              <LogOut
                size={17}
              />

              Logout

            </button>

          </div>

        </section>

      </main>

    </div>
  );
}


/* ============================================================
   PASSWORD FIELD
============================================================ */

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  setShow,
  disabled,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  disabled: boolean;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div>

      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>


      <div className="relative">

        <Lock
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />


        <input
          id={id}
          type={
            show
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          autoComplete={
            autoComplete
          }
          placeholder={
            placeholder
          }
          disabled={disabled}
          className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />


        <button
          type="button"
          onClick={() =>
            setShow(
              !show,
            )
          }
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:text-[#32145f] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={
            show
              ? `Hide ${label}`
              : `Show ${label}`
          }
        >

          {show ? (
            <EyeOff
              size={18}
            />
          ) : (
            <Eye
              size={18}
            />
          )}

        </button>

      </div>

    </div>
  );
}