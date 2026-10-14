import type { ReactNode } from "react";
import Link from "next/link";

export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_40%,#fafafa_100%)] px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          ← LocalPlate AI
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {title}
        </h1>

        {updated && (
          <p className="mt-2 text-sm text-zinc-500">Last updated: {updated}</p>
        )}

        {intro && (
          <p className="mt-5 text-[15px] leading-7 text-zinc-700">{intro}</p>
        )}

        <div className="mt-8 space-y-8">{children}</div>
      </article>
    </main>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-zinc-700">
        {children}
      </div>
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 ps-5">{children}</ul>;
}