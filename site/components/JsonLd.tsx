/**
 * JSON-LD structured data block.
 *
 * Rendered only on the server, so the payload never hydrates into client
 * state — search engines read it straight from the HTML.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}