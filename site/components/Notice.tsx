export default function Notice({
  title = "Source unavailable",
  message,
  detail,
}: {
  title?: string;
  message: string;
  detail?: string;
}) {
  return (
    <div className="surface mx-auto mt-6 max-w-xl p-8 text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full border border-accent/25 bg-accent/10 text-base text-accent"
      >
        !
      </div>
      <h1 className="text-base font-extrabold tracking-tight text-fg">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
      {detail ? (
        <p className="mt-4 overflow-auto rounded-lg border border-line bg-ink px-3 py-2 text-left text-[11px] leading-relaxed text-muted/80">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
