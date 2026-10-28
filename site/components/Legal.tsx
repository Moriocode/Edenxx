import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="border-b border-line/70 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-muted">Last updated: {updated}</p>
        {intro ? <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p> : null}
      </header>
      <div className="mt-6 space-y-6 leading-relaxed">{children}</div>
    </article>
  );
}

export function Section({
  id,
  n,
  title,
  children,
}: {
  id?: string;
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-2 text-sm font-extrabold tracking-tight text-white">
        {n}) {title}
      </h2>
      <div className="space-y-2 text-[13.5px] text-muted">{children}</div>
    </section>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-[13.5px] text-muted marker:text-accent/70">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
