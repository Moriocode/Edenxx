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
    <div className="mx-auto max-w-xl rounded-xl border border-line bg-panel p-8 text-center">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-panel2 text-xl">
        ⚠️
      </div>
      <h1 className="text-base font-extrabold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
      {detail ? (
        <p className="mt-3 overflow-auto rounded-lg border border-line bg-ink px-3 py-2 text-left text-[11px] text-muted/80">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
