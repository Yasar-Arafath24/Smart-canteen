import {
  ArrowLeft,
  Loader2,
  Mail,
} from "lucide-react";

import { useState } from "react";
import type { FormEvent } from "react";


import {
  Link,
} from "react-router-dom";

import {
  api,
} from "../../api/client";


export default function ForgotPassword() {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response =
        await api.post(
          "/auth/forgot-password",
          {
            email:
              email.trim(),
          },
        );

      setMessage(
        response.data?.message ||
          "If an account exists for this email, a password reset link has been sent.",
      );
    } catch (
      err: any
    ) {
      setError(
        err?.response?.data
          ?.detail ||
          "Unable to process your request.",
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

            <ArrowLeft
              size={18}
            />

            Back to login

          </Link>


          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">

            <div className="mb-8">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">

                <Mail
                  size={23}
                  className="text-[#32145f]"
                />

              </div>

              <h1 className="mt-5 text-2xl font-bold text-[#24113f]">
                Forgot password?
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

            </div>


            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}


            {message && (
              <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
                {message}
              </div>
            )}


            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="forgot-email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(
                      event,
                    ) =>
                      setEmail(
                        event.target
                          .value,
                      )
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={
                      loading
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                </div>

              </div>


              <button
                type="submit"
                disabled={
                  loading
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#32145f] py-3.5 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}

              </button>

            </form>


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