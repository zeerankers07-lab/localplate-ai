"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

const LINKS: { href: string; label: TranslationKey }[] = [
  { href: "/recipes", label: "footer.recipes" },
  { href: "/privacy", label: "footer.privacy" },
  { href: "/terms", label: "footer.terms" },
  { href: "/contact", label: "footer.contact" },
];

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white px-4 py-6 pb-20 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-zinc-500 sm:flex-row">
        <p>
          © {year} LocalPlate AI. {t("footer.rights")}
        </p>

        <nav aria-label={t("footer.nav")}>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {t(link.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}