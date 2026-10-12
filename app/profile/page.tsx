"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function ProfilePage() {
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const profileName =
          typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : "";

        if (!cancelled) {
          setEmail(user.email ?? "");
          setName(profileName);
          setOriginalName(profileName);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);

        if (!cancelled) {
          setError(t("pr.loadFail"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t("pr.needName"));
      return;
    }

    if (trimmedName === originalName) {
      setMessage(t("pr.upToDate"));
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          name: trimmedName,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setName(trimmedName);
      setOriginalName(trimmedName);
      setMessage(t("pr.updated"));
    } catch (err) {
      console.error("Failed to update profile:", err);

      setError(
        err instanceof Error
          ? err.message
          : t("pr.updateFail")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    setError("");
    setMessage("");
    setLoggingOut(true);

    try {
      const supabase = createClient();
      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);

      setError(t("pr.logoutFail"));
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffaf5] px-5 py-12 text-zinc-900 md:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="rounded-3xl border border-zinc-100 bg-white px-8 py-7 text-center shadow-lg shadow-zinc-200/30">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-orange-600" />
            <p className="mt-4 text-sm font-medium text-zinc-500">
              {t("pr.loading")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] px-5 py-10 text-zinc-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 shadow-sm transition hover:border-orange-400 hover:bg-orange-50"
          >
            {t("pr.back")}
          </button>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-xl shadow-zinc-200/30">
          <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-orange-600 text-3xl font-bold text-white shadow-lg shadow-orange-200">
                {name.trim()
                  ? name.trim().charAt(0).toUpperCase()
                  : email.charAt(0).toUpperCase() || "U"}
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-600">
                  LocalPlate AI
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
                  {t("pr.title")}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
                  {t("pr.sub")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.8fr] md:p-10">
            <form onSubmit={handleSave}>
              <div>
                <label
                  htmlFor="profile-name"
                  className="text-sm font-bold text-zinc-800"
                >
                  {t("pr.name")}
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("pr.phName")}
                  autoComplete="name"
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="mt-6">
                <label
                  htmlFor="profile-email"
                  className="text-sm font-bold text-zinc-800"
                >
                  {t("pr.email")}
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  readOnly
                  className="mt-2 w-full cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-100 px-5 py-4 text-sm text-zinc-500 outline-none"
                />

                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  {t("pr.emailNote")}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium leading-6 text-green-700"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-orange-600 px-6 py-4 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t("pr.saving") : t("pr.save")}
              </button>
            </form>

            <aside className="rounded-3xl border border-zinc-100 bg-[#fffaf5] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                {t("pr.account")}
              </p>

              <h2 className="mt-2 text-xl font-bold text-zinc-900">
                {t("pr.quick")}
              </h2>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => router.push("/planner")}
                  className="w-full rounded-2xl border border-orange-200 bg-white px-5 py-3.5 text-left text-sm font-bold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50"
                >
                  {t("pr.createPlan")}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/weekly-plan")}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-left text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                >
                  {t("pr.weekly")}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/saved-plans")}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-left text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                >
                  {t("pr.saved")}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full rounded-2xl bg-zinc-900 px-5 py-3.5 text-left text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? t("nav.loggingOut") : t("pr.logout")}
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}