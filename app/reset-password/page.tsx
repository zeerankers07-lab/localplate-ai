"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "This password reset link is invalid or has expired. Please request a new reset link."
        );
      }

      setCheckingSession(false);
    }

    checkSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage(
        "Your password has been updated successfully. Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1800);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to update your password.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#eef4ff] px-4 py-10 text-zinc-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,71,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(15,71,184,0.07) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[650px] items-center justify-center">
        <div className="relative flex min-h-[540px] w-[min(94vw,700px)] items-center justify-center rounded-[50%] border border-white/80 bg-white/30 p-7 shadow-[0_30px_100px_rgba(15,71,184,0.18)] backdrop-blur-2xl sm:p-12">
          <div className="pointer-events-none absolute inset-6 rounded-[50%] border border-white/50 sm:inset-10" />

          <div className="relative z-10 w-full max-w-[380px] px-3">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-2xl shadow-lg shadow-blue-300/40">
                🔑
              </div>

              <p className="text-xs font-bold tracking-[0.22em] text-blue-700">
                LOCALPLATE AI
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Set new password
              </h1>

              <p className="mx-auto mt-2 max-w-[330px] text-sm leading-6 text-zinc-500">
                Create a new secure password for your LocalPlate AI account.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50/80 px-4 py-3 text-sm leading-5 text-green-700">
                {message}
              </div>
            )}

            {checkingSession ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-center text-sm text-blue-700">
                Checking reset link...
              </div>
            ) : !error || error.includes("invalid") === false ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-zinc-700"
                  >
                    New password
                  </label>

                  <div className="flex items-center rounded-xl border border-white/90 bg-white/70 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                    <span className="mr-2.5 text-blue-600">🔒</span>

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a new password"
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="ml-2 rounded-lg p-1.5 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-sm font-medium text-zinc-700"
                  >
                    Confirm new password
                  </label>

                  <div className="flex items-center rounded-xl border border-white/90 bg-white/70 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                    <span className="mr-2.5 text-blue-600">🔒</span>

                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Repeat your new password"
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="ml-2 rounded-lg p-1.5 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-300/40 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating password..." : "Update password"}
                </button>
              </form>
            ) : null}

            <div className="mt-6 text-center text-sm text-zinc-500">
              <Link
                href="/login"
                className="font-semibold text-blue-700 transition hover:text-blue-900"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}