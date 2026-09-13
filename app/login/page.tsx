"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
        <path d="M9.88 4.24A9.8 9.8 0 0 1 12 4c5 0 8.5 5 8.5 5a15.8 15.8 0 0 1-2.02 2.71" />
        <path d="M6.61 6.61C4.28 8.06 3.5 9 3.5 9s3.5 5 8.5 5a8.7 8.7 0 0 0 2.13-.26" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.23a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.7 2.92-4.2 2.92-7.24Z"
      />
      <path
        fill="#34A853"
        d="M12 21.9c2.63 0 4.84-.87 6.45-2.43l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.9Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.92A5.86 5.86 0 0 1 6.23 12c0-.67.12-1.32.31-1.92V7.56H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.44l3.24-2.52Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.05c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.1 14.63 2.1 12 2.1a9.75 9.75 0 0 0-8.7 5.46l3.24 2.52C7.31 7.77 9.46 6.05 12 6.05Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    const popupSeen = sessionStorage.getItem(
      "localplate_login_popup_seen"
    );

    if (!popupSeen) {
      setShowWelcomePopup(true);
    }
  }, []);

  function closeWelcomePopup() {
    sessionStorage.setItem("localplate_login_popup_seen", "true");
    setShowWelcomePopup(false);
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleGoogleLogin() {
    setError("");
    setMessage("");
    setGoogleLoading(true);

    try {
      const supabase = createClient();

      const { error: googleError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/planner`,
          },
        });

      if (googleError) {
        throw googleError;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Google login failed. Please try again.";

      setError(errorMessage);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your name.");
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
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) {
          if (
            loginError.message.toLowerCase().includes("invalid login")
          ) {
            throw new Error(
              "Email or password is incorrect. If you do not have an account yet, please create one first."
            );
          }

          if (
            loginError.message.toLowerCase().includes("not confirmed")
          ) {
            throw new Error(
              "Your email is not confirmed yet. Please confirm your email and try again."
            );
          }

          throw loginError;
        }

        window.location.href = "/planner";
        return;
      }

      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/planner`,
        },
      });

      if (signupError) {
        if (
          signupError.message.toLowerCase().includes("already registered")
        ) {
          throw new Error(
            "This email is already registered. Please sign in instead."
          );
        }

        throw signupError;
      }

      setMessage(
        "Account created successfully. Please check your email to confirm your account."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100dvh-56px)] overflow-hidden bg-[#eef4ff] px-3 py-5 text-zinc-900 sm:min-h-[calc(100vh-72px)] sm:px-6 sm:py-8 lg:py-10">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,71,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(15,71,184,0.07) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* Background liquid blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-56px)] w-full items-start justify-center px-0 py-1 sm:min-h-[calc(100vh-72px)] sm:items-center sm:px-2 sm:py-6">
        {/* Main circular liquid-glass container */}
        <div className="relative flex min-h-0 w-full max-w-[370px] items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/25 p-4 shadow-[0_24px_80px_rgba(15,71,184,0.16)] backdrop-blur-2xl sm:h-[min(88vw,620px)] sm:w-[min(94vw,620px)] sm:max-w-none sm:rounded-full sm:p-8">
          {/* Inner circular ring */}
          <div className="pointer-events-none absolute inset-2.5 rounded-[1.4rem] border border-white/50 sm:inset-10 sm:rounded-full" />

          {/* Decorative circles */}
          <div className="pointer-events-none absolute left-[12%] top-[18%] h-5 w-5 rounded-full bg-blue-500/30 blur-[1px]" />
          <div className="pointer-events-none absolute right-[15%] top-[27%] h-3 w-3 rounded-full bg-cyan-400/60" />
          <div className="pointer-events-none absolute bottom-[20%] left-[18%] h-4 w-4 rounded-full bg-blue-400/40" />
          <div className="pointer-events-none absolute bottom-[17%] right-[20%] h-6 w-6 rounded-full bg-white/70 blur-[1px]" />

          {/* Content directly inside circle */}
          <div className="relative z-10 w-full max-w-[340px] px-1 py-1 sm:max-w-[370px] sm:px-0 sm:py-0">
            {/* Brand */}
            <div className="mb-4 text-center sm:mb-5">
              <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center sm:mb-3 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-xl shadow-lg shadow-blue-300/40">
                🍽️
              </div>

              <p className="text-xs font-bold tracking-[0.22em] text-blue-700">
                LOCALPLATE AI
              </p>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
                {mode === "login"
                  ? "Welcome back"
                  : "Create your account"}
              </h1>

              <p className="mx-auto mt-1.5 max-w-[330px] text-xs leading-5 text-zinc-500 sm:text-sm">
                {mode === "login"
                  ? "Sign in to continue planning smarter meals."
                  : "Join LocalPlate AI and start planning personalized meals."}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs leading-4 text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-3 rounded-xl border border-green-200 bg-green-50/80 px-3 py-2 text-xs leading-4 text-green-700">
                {message}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-2"
              autoComplete="on"
            >
              {/* Name */}
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    Full name
                  </label>

                  <div className="flex items-center rounded-xl border border-white/90 bg-white/65 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                    <span className="mr-2.5 text-blue-600">
                      <UserIcon />
                    </span>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      className="h-10 min-w-0 w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-medium text-zinc-700"
                >
                  Email address
                </label>

                <div className="flex items-center rounded-xl border border-white/90 bg-white/65 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                  <span className="mr-2.5 text-blue-600">
                    <MailIcon />
                  </span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-10 min-w-0 w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-xs font-medium text-zinc-700"
                >
                  Password
                </label>

                <div className="flex items-center rounded-xl border border-white/90 bg-white/65 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                  <span className="mr-2.5 text-blue-600">
                    <LockIcon />
                  </span>

                  <input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      mode === "login"
                        ? "Your password"
                        : "Create a password"
                    }
                    className="h-10 min-w-0 w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
                  />

                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      const input = passwordRef.current;
                      const start =
                        input?.selectionStart ?? password.length;
                      const end =
                        input?.selectionEnd ?? password.length;

                      setShowPassword((value) => !value);

                      requestAnimationFrame(() => {
                        input?.focus();
                        input?.setSelectionRange(start, end);
                      });
                    }}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="ml-1.5 rounded-lg p-1.5 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600"
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1 block text-xs font-medium text-zinc-700"
                  >
                    Confirm password
                  </label>

                  <div className="flex items-center rounded-xl border border-white/90 bg-white/65 px-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/70">
                    <span className="mr-2.5 text-blue-600">
                      <LockIcon />
                    </span>

                    <input
                      ref={confirmPasswordRef}
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Repeat your password"
                      className="h-10 min-w-0 w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400"
                    />

                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        const input = confirmPasswordRef.current;
                        const start = input?.selectionStart ?? confirmPassword.length;
                        const end = input?.selectionEnd ?? confirmPassword.length;
                        setShowConfirmPassword((value) => !value);
                        requestAnimationFrame(() => {
                          input?.focus();
                          input?.setSelectionRange(start, end);
                        });
                      }}
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="ml-1.5 rounded-lg p-1.5 text-zinc-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <EyeIcon hidden={!showConfirmPassword} />
                    </button>
                  </div>
                </div>
              )}

              {/* Remember + forgot */}
              {mode === "login" && (
                <div className="flex items-center justify-between gap-3 px-1 pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(event.target.checked)
                      }
                      className="h-3.5 w-3.5 rounded border-zinc-300 accent-blue-600"
                    />
                    Remember me
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-1.5 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-300/40 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? mode === "login"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            {/* Google Login */}
            {mode === "login" && (
              <>
                <div className="my-3.5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-300/70" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400">
                    Or continue with
                  </span>
                  <div className="h-px flex-1 bg-zinc-300/70" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white/80 px-5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <GoogleIcon />
                  {googleLoading
                    ? "Connecting to Google..."
                    : "Continue with Google"}
                </button>
              </>
            )}

            {/* Switch mode */}
            <div className="mt-3.5 text-center text-xs text-zinc-500 sm:text-sm">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            <p className="mx-auto mt-2.5 max-w-[330px] text-center text-[10px] leading-4 text-zinc-400">
              Your account helps keep your LocalPlate AI experience personal
              and secure.
            </p>
          </div>
        </div>
      </div>

      {/* Welcome / Login instructions popup */}
      {showWelcomePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-4 sm:px-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-popup-title"
        >
          <div className="relative w-full max-w-[360px] overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
            <div className="h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400" />

            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-lg shadow-md shadow-blue-200/70">
                  🍽️
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold tracking-[0.2em] text-blue-700">
                    LOCALPLATE AI
                  </p>
                  <h2
                    id="welcome-popup-title"
                    className="mt-0.5 text-lg font-bold tracking-tight text-zinc-900"
                  >
                    Welcome!
                  </h2>
                  <p className="text-[11px] leading-4 text-zinc-500">
                    Login ke liye quick guide
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50/80 p-2.5">
                  <span className="text-sm">🆕</span>
                  <div>
                    <p className="text-xs font-bold text-blue-900">New user</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-zinc-600">
                      <strong>Create Account / Sign Up</strong> karein aur
                      name, email aur password set karein.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/90 p-2.5">
                  <span className="text-sm">🔐</span>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      Existing account
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-zinc-600">
                      Registered email aur password se <strong>Sign In</strong>
                      karein.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5">
                  <span className="text-sm">💡</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      Google / Gmail
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-zinc-600">
                      Gmail ke liye <strong>Continue with Google</strong>
                      use karein. Google password ko normal password field
                      mein use na karein.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeWelcomePopup}
                className="mt-3.5 flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-4 text-xs font-semibold text-white shadow-md shadow-blue-300/30 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 active:translate-y-0"
              >
                Got it, continue
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}