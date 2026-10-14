"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

const MAX_LENGTH = 500;
const MIN_LENGTH = 10;
const LAST_SENT_KEY = "localplate_feedback_last";

type FeedbackType = "feature" | "problem" | "other";

const TYPES: { id: FeedbackType; key: TranslationKey }[] = [
  { id: "feature", key: "fb.type.feature" },
  { id: "problem", key: "fb.type.problem" },
  { id: "other", key: "fb.type.other" },
];

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm";

export default function FeedbackWidget() {
  const { t, lang, currency } = useI18n();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feature");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [notice, setNotice] = useState("");

  // Know who is writing (optional) when the panel opens.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        setUserId(user?.id ?? null);
        setUserEmail(user?.email ?? "");
      } catch {
        // Anonymous feedback is fine.
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Lets other pages (e.g. Contact) open this panel.
  useEffect(() => {
    const openPanel = () => setOpen(true);

    window.addEventListener("localplate:open-feedback", openPanel);
    return () =>
      window.removeEventListener("localplate:open-feedback", openPanel);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Bots fill the hidden field. Pretend it worked.
    if (trap) {
      setStatus("sent");
      return;
    }

    const text = message.trim();

    if (text.length < MIN_LENGTH) {
      setNotice(t("fb.tooShort"));
      return;
    }

    try {
      const last = Number(localStorage.getItem(LAST_SENT_KEY) || 0);

      if (Date.now() - last < 60_000) {
        setNotice(t("fb.wait"));
        return;
      }
    } catch {
      // Ignore storage problems.
    }

    setStatus("sending");
    setNotice("");

    try {
      const supabase = createClient();

      const { error } = await supabase.from("feedback").insert({
        type,
        message: text.slice(0, MAX_LENGTH),
        email: (userEmail || email).trim().slice(0, 200) || null,
        page: pathname.slice(0, 200),
        language: lang,
        currency,
        user_id: userId,
      });

      if (error) throw error;

      try {
        localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      } catch {
        // Ignore storage problems.
      }

      setMessage("");
      setStatus("sent");
    } catch (sendError) {
      console.error("Could not send feedback:", sendError);
      setStatus("idle");
      setNotice(t("fb.error"));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-4 end-4 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white shadow-lg outline-none transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M4 5h16v11H9l-5 4V5z" />
        </svg>
        <span className="hidden sm:inline">{t("fb.button")}</span>
        <span className="sr-only sm:hidden">{t("fb.button")}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-labelledby="feedback-title"
          className="fixed bottom-20 end-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="feedback-title" className="font-semibold">
              {t("fb.title")}
            </h2>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("fb.close")}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-500 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                className="size-4"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {status === "sent" ? (
            <div className="mt-4">
              <p className="text-sm text-zinc-700">{t("fb.thanks")}</p>

              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-4 h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                {t("fb.another")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3 space-y-3">
              <div
                className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1"
                role="group"
                aria-label={t("fb.typeAria")}
              >
                {TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    aria-pressed={type === item.id}
                    className={`min-h-9 rounded-md px-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      type === item.id
                        ? "bg-white text-orange-700 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {t(item.key)}
                  </button>
                ))}
              </div>

              <div>
                <label
                  htmlFor="feedback-message"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  {t("fb.message")}
                </label>

                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value.slice(0, MAX_LENGTH))
                  }
                  maxLength={MAX_LENGTH}
                  rows={4}
                  placeholder={t("fb.placeholder")}
                  className={`${fieldClass} resize-none py-2`}
                />

                <p className="mt-1 text-end text-xs text-zinc-400">
                  {message.length}/{MAX_LENGTH}
                </p>
              </div>

              {!userEmail && (
                <div>
                  <label
                    htmlFor="feedback-email"
                    className="mb-1.5 block text-xs font-medium text-zinc-500"
                  >
                    {t("fb.email")}
                  </label>

                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={200}
                    autoComplete="email"
                    className={`${fieldClass} h-10`}
                  />
                </div>
              )}

              {/* Hidden field for bots */}
              <input
                type="text"
                name="website"
                value={trap}
                onChange={(event) => setTrap(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              {notice && (
                <p role="alert" className="text-sm text-red-600">
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="h-10 w-full rounded-lg bg-orange-600 text-sm font-semibold text-white outline-none transition hover:bg-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {status === "sending" ? t("fb.sending") : t("fb.send")}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}