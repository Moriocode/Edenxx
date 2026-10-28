import Link from "next/link";
import Notice from "@/components/Notice";
import { allTags } from "@/lib/source";

export const revalidate = 3600;

export default async function TagsPage() {
  let tags;
  try {
    tags = await allTags();
  } catch (err) {
    return (
      <Notice
        title="Tag index unavailable"
        message="Couldn't load the tag index from the source."
        detail={err instanceof Error ? err.message : String(err)}
      />
    );
  }

  const groups = new Map<string, typeof tags>();
  for (const t of tags) {
    const letter = (t.label[0] || "#").toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(t);
  }
  const letters = [...groups.keys()].sort();

  return (
    <div className="space-y-6">
      <header className="border-b border-line/70 pb-3">
        <h1 className="text-xl font-extrabold tracking-tight">Tags</h1>
        <p className="mt-0.5 text-xs text-muted">
          {tags.length} tags indexed · browse by tag to find comics
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {letters.map((l) => (
          <a
            key={l}
            href={`#letter-${l}`}
            className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-bold text-white/75 hover:border-accent/60 hover:text-accent"
          >
            {l}
          </a>
        ))}
      </div>

      <div className="space-y-6">
        {letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
            <h2 className="mb-2 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-muted">
              <span className="h-3 w-1 rounded bg-accent" />
              {letter}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {groups.get(letter)!.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tag/${t.slug}`}
                  className="rounded-md border border-line bg-panel2 px-2.5 py-1 text-[12px] font-semibold text-white/75 transition hover:border-accent/60 hover:text-accent"
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
