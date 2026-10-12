"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import LanguageSwitcher from "./LanguageSwitcher";

type UserState = {
    email: string | null;
};

export default function Navbar() {
    const { t } = useI18n();
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState<UserState | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    const links: { href: string; label: TranslationKey; icon: string }[] = [
        { href: "/", label: "nav.home", icon: "⌂" },
        { href: "/cook", label: "nav.cook", icon: "🍳" },
        { href: "/planner", label: "nav.planner", icon: "🤖" },
        { href: "/weekly-plan", label: "nav.weekly", icon: "📅" },
        { href: "/saved-plans", label: "nav.saved", icon: "▣" },
        { href: "/shopping-list", label: "nav.shopping", icon: "🛒" },
    ];

    useEffect(() => {
        const supabase = createClient();

        async function loadUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(
                user
                    ? { email: user.email ?? null }
                    : null
            );
            setLoading(false);
        }

        loadUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(
                session?.user
                    ? { email: session.user.email ?? null }
                    : null
            );
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Keep the active link visible in the scrollable mobile navigation.
    useEffect(() => {
        navRef.current
            ?.querySelector<HTMLElement>('[aria-current="page"]')
            ?.scrollIntoView({ inline: "center", block: "nearest" });
    }, [pathname]);

    async function handleLogout() {
        setLoggingOut(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error("Logout error:", error);
                return;
            }

            setUser(null);
            router.push("/");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <header className="w-full border-b border-zinc-800 bg-zinc-950 px-3 py-3 sm:px-5 sm:py-4 md:px-8 lg:px-10">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-2 sm:gap-4 lg:gap-6">

                {/* Logo */}
                <Link href="/" className="group shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-lg shadow-sm transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11">
                            🍽️
                        </div>

                        <div className="hidden sm:block">
                            <div className="text-[19px] font-bold tracking-tight text-white">
                                LocalPlate
                                <span className="text-orange-600"> AI</span>
                            </div>

                            <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                {t("nav.tagline")}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Navigation */}
                <nav
                    aria-label={t("nav.primary")}
                    className="min-w-0 flex-1 overflow-x-auto rounded-full border border-zinc-800 bg-zinc-950 p-1 shadow-lg shadow-zinc-900/15 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    <div
                        ref={navRef}
                        className="flex w-max min-w-full items-center justify-center gap-0.5"
                    >
                        {links.map((link) => {
                            const isActive =
                                !link.href.includes("#") &&
                                (link.href === "/"
                                    ? pathname === "/"
                                    : pathname === link.href ||
                                      pathname.startsWith(`${link.href}/`));

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-label={t(link.label)}
                                    aria-current={isActive ? "page" : undefined}
                                    title={t(link.label)}
                                    className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 sm:gap-2 sm:px-3.5 md:px-4 ${isActive
                                            ? "bg-white text-zinc-900 shadow-sm"
                                            : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <span className="text-[15px] leading-none">
                                        {link.icon}
                                    </span>
                                    <span className={isActive ? "inline" : "hidden lg:inline"}>
                                        {t(link.label)}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Auth Actions */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <LanguageSwitcher />

                    {loading ? (
                        <div className="h-10 w-16 animate-pulse rounded-full bg-zinc-800 sm:h-11 sm:w-28" />
                    ) : user ? (
                        <>
                            <div className="hidden max-w-[180px] truncate rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 xl:block">
                                {user.email}
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3 sm:text-sm"
                            >
                                {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm"
                            >
                                {t("nav.login")}
                            </Link>

                            <Link
                                href="/planner"
                                className="hidden rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-lg active:translate-y-0 sm:inline-flex"
                            >
                                {t("nav.getStarted")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}