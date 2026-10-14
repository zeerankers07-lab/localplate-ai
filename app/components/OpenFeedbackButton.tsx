"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";

// Opens the existing floating feedback panel (see FeedbackWidget).
export default function OpenFeedbackButton() {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("localplate:open-feedback"))}
      className="mt-4 inline-flex h-11 items-center rounded-full bg-orange-600 px-6 text-sm font-semibold text-white shadow-md shadow-orange-900/20 outline-none transition hover:bg-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
    >
      {t("fb.title")}
    </button>
  );
}