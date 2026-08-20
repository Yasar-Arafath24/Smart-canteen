import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import Footer from "../../components/Footer";

import {
  login,
  saveAuth,
} from "../../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login({
        username,
        password,
      });

      saveAuth(data);

      /* ======================================================
         ROLE-BASED REDIRECT
      ====================================================== */

      if (data.role === "admin") {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      if (data.role === "staff") {
        navigate("/staff", {
          replace: true,
        });

        return;
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: any) {
      console.error(
        "Login error:",
        err,
      );

      const detail =
        err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Invalid username or password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <div className="hidden bg-[#24113f] p-12 text-white lg:flex lg:flex-col lg:justify-between">

          <div>

            <h1 className="text-2xl font-bold tracking-tight">
              SmartCanteen
            </h1>

            <p className="mt-1 text-sm text-purple-200">
              Intelligent food ordering platform
            </p>

          </div>

          <div className="max-w-lg">

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
              Welcome back
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Your next meal
              <br />
              starts here.
            </h2>

            <p className="mt-6 text-lg leading-8 text-purple-100/70">
              Browse meals, place orders, make secure
              payments, and receive real-time updates.
            </p>

          </div>

          <p className="text-sm text-purple-200/50">
            © 2026 SmartCanteen
          </p>

        </div>

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            <div className="mb-10">

              <h2 className="text-3xl font-bold tracking-tight text-[#24113f]">
                Sign in
              </h2>

              <p className="mt-2 text-gray-500">
                Sign in to continue to SmartCanteen.
              </p>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* USERNAME */}

              <div>

                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Username
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-[#32145f] disabled:opacity-50"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
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

              {/* SIGN IN */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#32145f] py-3.5 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>

            </form>

            {/* REGISTER */}

            <p className="mt-8 text-center text-sm text-gray-500">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-[#32145f] hover:underline"
              >
                Create account
              </Link>

            </p>

          </div>

        </div>

      </div>

      <Footer />

    </div>
  );
}