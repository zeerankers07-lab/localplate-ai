"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n, type CurrencyCode } from "@/lib/i18n/LanguageProvider";
import { LANGS } from "@/lib/i18n/translations";

const CURRENCY_CODES: CurrencyCode[] = ["PKR", "INR", "USD"];

export default function LanguageSwitcher() {
  const { lang, setLang, currency, setCurrency, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGS.find((item) => item.code === lang) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("lang.aria")}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-200 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-500"
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
          <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />
        </svg>
        {current.short}
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-2 text-zinc-900 shadow-xl">
          <ul>
            {LANGS.map((item) => {
              const active = item.code === lang;

              return (
                <li key={item.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(item.code);
                      setOpen(false);
                    }}
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      active
                        ? "bg-orange-50 font-semibold text-orange-700"
                        : "hover:bg-zinc-100"
                    }`}
                  >
                    {item.native}
                    {active && <span aria-hidden="true">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-2 border-t border-zinc-100 pt-2">
            <p className="px-3 pb-1.5 text-xs text-zinc-500">
              {t("curr.label")}
            </p>

            <div className="flex gap-1 px-1" role="group" aria-label={t("curr.label")}>
              {CURRENCY_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  aria-pressed={currency === code}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    currency === code
                      ? "bg-orange-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}