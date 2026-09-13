"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "Password reset email sent. Please check your inbox and open the reset link."
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to send password reset email.";

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
        <div className="relative flex min-h-[520px] w-[min(94vw,700px)] items-center justify-center rounded-[50%] border border-white/80 bg-white/30 p-7 shadow-[0_30px_100px_rgba(15,71,184,0.18)] backdrop-blur-2xl sm:p-12">
          <div className="pointer-events-none absolute inset-6 rounded-[50%] border border-white/50 sm:inset-10" />

          <div className="relative z-10 w-full max-w-[380px] px-3">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-2xl shadow-lg shadow-blue-300/40">
                🔐
              </div>

              <p className="text-xs font-bold tracking-[0.22em] text-blue-700">
                LOCALPLATE AI
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Forgot password?
              </h1>

              <p className="mx-auto mt-2 max-w-[330px] text-sm leading-6 text-zinc-500">
                Enter your registered email and we&apos;ll send you a secure
                password reset link.
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-zinc-700"
                >
                  Email address
                </label>

                <div className="flex items-center rounded-xl border border-white/90 bg-white/70 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                  <span className="mr-2.5 text-blue-600">✉️</span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-300/40 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 transition hover:text-blue-900"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}