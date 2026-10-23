// Inline scripts go in by hash, so the policy follows the page: the theme script, and the import map off a build.
// Inline style attributes are allowed, hence 'unsafe-inline' for styles only; blob: is the thumbnail upload's preview.
export async function contentSecurityPolicy(html: string | Uint8Array<ArrayBuffer>): Promise<string> {
  const hashes: string[] = [];
  let text = '';
  await new HTMLRewriter()
    .on('script:not([src]):not([type="application/json"])', {
      text: (chunk) => {
        text += chunk.text;
        if (chunk.lastInTextNode) {
          // The browser hashes the text after the parser turned CR LF into LF.
          const normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
          hashes.push(`'sha256-${new Bun.CryptoHasher('sha256').update(normalized).digest('base64')}'`);
          text = '';
        }
      },
    })
    .transform(new Response(html))
    .text();
  return [
    "default-src 'self'",
    ['script-src', "'self'", ...hashes].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}
