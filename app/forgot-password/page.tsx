"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) throw resetError;

      setMessage("Password reset email sent. Please check your inbox and open the reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send password reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#eef4ff] px-3 py-5 text-zinc-900 sm:px-6 sm:py-8 lg:py-10">
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
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-72px)] w-full items-center justify-center py-2 sm:py-4">
        <section className="relative w-full max-w-[520px] rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-[0_24px_80px_rgba(15,71,184,0.16)] backdrop-blur-2xl sm:rounded-[38px] sm:p-8">
          <div className="pointer-events-none absolute inset-2.5 rounded-[22px] border border-white/55 sm:inset-4 sm:rounded-[30px]" />

          <div className="relative z-10 mx-auto w-full max-w-[390px]">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-300/40">
                <LockIcon />
              </div>
              <p className="text-xs font-bold tracking-[0.22em] text-blue-700">LOCALPLATE AI</p>
              <h1 className="mt-2 text-[28px] font-bold tracking-tight sm:text-3xl">Forgot password?</h1>
              <p className="mx-auto mt-2 max-w-[340px] text-sm leading-5 text-zinc-500">
                Enter your registered email and we&apos;ll send you a secure password reset link.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm leading-5 text-emerald-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">Email address</label>
                <div className="flex min-w-0 items-center rounded-xl border border-white/90 bg-white/80 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                  <span className="mr-2.5 shrink-0 text-blue-600"><MailIcon /></span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 min-w-0 w-full bg-transparent text-[15px] outline-none placeholder:text-zinc-400"
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

            <div className="mt-6 flex flex-wrap items-center justify-center gap-1 text-center text-sm text-zinc-500">
              <span>Remember your password?</span>
              <Link href="/login" className="font-semibold text-blue-700 transition hover:text-blue-900">
                Back to sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
