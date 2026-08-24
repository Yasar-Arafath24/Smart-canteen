import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";

import { useState } from "react";
import type { FormEvent } from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { api } from "../../api/client";


export default function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token") || "";


  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "This password reset link is invalid or missing.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/auth/reset-password",
        {
          token,
          new_password: newPassword,
        },
      );

      setSuccess(
        "Password reset successfully. Redirecting to login...",
      );

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to reset your password.",
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          <Link
            to="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#32145f]"
          >
            <ArrowLeft size={18} />
            Back to login
          </Link>


          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">

            <div className="mb-8">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
                <KeyRound
                  size={23}
                  className="text-[#32145f]"
                />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-[#24113f]">
                Reset password
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Choose a new password for your SmartCanteen account.
              </p>

            </div>


            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}


            {success && (
              <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}


            {!token ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                Invalid or missing password reset token.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NEW PASSWORD */}

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    New password
                  </label>

                  <div className="relative">

                    <input
                      id="new-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value,
                        )
                      }
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-4 pr-12 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value,
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-[#32145f]"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>
                </div>


                {/* CONFIRM PASSWORD */}

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value,
                        )
                      }
                      autoComplete="new-password"
                      required
                      disabled={loading}
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-4 pr-12 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value,
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-[#32145f]"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>
                </div>


                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#32145f] py-3.5 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>

              </form>
            )}


            <p className="mt-7 text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#32145f] hover:underline"
              >
                Sign in
              </Link>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}