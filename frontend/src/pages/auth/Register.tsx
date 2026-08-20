import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { api } from "../../api/client";

import Footer from "../../components/Footer";


interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}


interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}


export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<RegisterForm>({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

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


  function updateForm(
    field: keyof RegisterForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const email =
      form.email.trim().toLowerCase();

    const password =
      form.password;

    const confirmPassword =
      form.confirmPassword;


    if (name.length < 2) {
      setError(
        "Name must contain at least 2 characters.",
      );
      return;
    }


    if (!email) {
      setError(
        "Email address is required.",
      );
      return;
    }


    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );
      return;
    }


    try {
      setLoading(true);

      const response =
        await api.post<RegisterResponse>(
          "/auth/register",
          {
            name,
            email,
            password,
          },
        );


      setSuccess(
        `Account created successfully for ${response.data.name}.`,
      );


      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });


      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);

    } catch (err: any) {
      console.error(
        "Registration error:",
        err,
      );

      const detail =
        err?.response?.data?.detail;

      if (
        Array.isArray(detail)
      ) {
        setError(
          detail
            .map(
              (item: any) =>
                item?.msg ||
                "Invalid registration data.",
            )
            .join(" "),
        );
      } else {
        setError(
          typeof detail ===
          "string"
            ? detail
            : "Unable to create your account.",
        );
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-white">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ==================================================
            LEFT
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
              Join SmartCanteen
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Your next meal
              <br />
              starts here.
            </h2>

            <p className="mt-6 text-lg leading-8 text-purple-100/70">
              Create your account and start browsing meals,
              placing orders, and receiving updates.
            </p>

          </div>


          <p className="text-sm text-purple-200/50">
            © 2026 SmartCanteen
          </p>

        </div>


        {/* ==================================================
            RIGHT
        ================================================== */}

        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            <div className="mb-8">

              <h2 className="text-3xl font-bold tracking-tight text-[#24113f]">
                Create account
              </h2>

              <p className="mt-2 text-gray-500">
                Create your SmartCanteen customer account.
              </p>

            </div>


            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}


            {success && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">

                <CheckCircle2
                  size={18}
                />

                {success}

              </div>
            )}


            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* NAME */}

              <div>

                <label
                  htmlFor="register-name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Full name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="register-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div>

                <label
                  htmlFor="register-email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="register-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="register-password"
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
                    id="register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={form.password}
                    onChange={(event) =>
                      updateForm(
                        "password",
                        event.target.value,
                      )
                    }
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-[#32145f]"
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
                  htmlFor="register-confirm-password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="register-confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      form.confirmPassword
                    }
                    onChange={(event) =>
                      updateForm(
                        "confirmPassword",
                        event.target.value,
                      )
                    }
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-[#32145f] focus:ring-4 focus:ring-purple-100 disabled:bg-gray-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) =>
                          !value,
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-[#32145f]"
                  >
                    {showConfirmPassword ? (
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


              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#32145f] py-3.5 text-sm font-semibold text-white transition hover:bg-[#421b7a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>


            <p className="mt-8 text-center text-sm text-gray-500">

              Already have an account?{" "}

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

      <Footer />

    </div>
  );
}