export type Dictionary = Readonly<Record<string, string>>;

export function normalizedCopy(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_match: string, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_match: string, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/\s+/g, ' ')
    .trim();
}

export function translateCopy(value: string, dictionary: Dictionary): string {
  const key = normalizedCopy(value);
  const translated = Object.hasOwn(dictionary, key)
    ? dictionary[key]
    : undefined;
  if (translated === undefined) return value;
  const start = /^\s*/.exec(value)?.[0] ?? '';
  const end = /\s*$/.exec(value)?.[0] ?? '';
  return start + translated + end;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Translate only authored text and accessible labels in trusted, rendered templates.
 * Code, scripts, styles, user regions, input values and protocol attributes stay byte-for-byte intact.
 * This is a template-copy transformer, never an HTML sanitizer or an untrusted markup parser.
 */
export function translateHtml(
  html: string,
  dictionary: Dictionary,
  links: Readonly<Record<string, string>> = {},
): string {
  const tokens =
    /<!--[\s\S]*?-->|<(script|style)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  const stack: { tag: string; protected: boolean }[] = [];
  let cursor = 0;
  let result = '';
  function copy(value: string): string {
    if (stack.some((item) => item.protected)) return value;
    const translated = translateCopy(value, dictionary);
    return translated === value ? value : escapeHtml(translated);
  }
  for (const match of html.matchAll(tokens)) {
    const token = match[0];
    result += copy(html.slice(cursor, match.index));
    cursor = match.index + token.length;
    if (/^<!--|^<!|^<(?:script|style)\b/i.test(token)) {
      result += token;
      continue;
    }
    const closing = /^<\//.test(token);
    const tag = /^<\/?([a-z][\w:-]*)/i.exec(token)?.[1]?.toLowerCase();
    if (!tag) {
      result += token;
      continue;
    }
    if (closing) {
      const index = stack.map((item) => item.tag).lastIndexOf(tag);
      if (index >= 0) stack.splice(index);
      result += token;
      continue;
    }
    const protectedRegion =
      stack.some((item) => item.protected) ||
      ['code', 'pre', 'svg'].includes(tag) ||
      /\bdata-user-content(?:[\s=>]|$)/.test(token);
    result += token.replace(
      /([\w:-]+)=(["'])([\s\S]*?)\2/g,
      (attribute: string, name: string, quote: string, value: string) => {
        if (
          !protectedRegion &&
          [
            'aria-label',
            'aria-description',
            'aria-valuetext',
            'aria-roledescription',
            'title',
            'alt',
            'placeholder',
            'content',
          ].includes(name.toLowerCase())
        ) {
          const translated = translateCopy(value, dictionary);
          if (translated !== value)
            return name + '=' + quote + escapeHtml(translated) + quote;
        }
        if (
          name === 'href' &&
          !protectedRegion &&
          !/\bhreflang=/.test(token) &&
          Object.hasOwn(links, normalizedCopy(value))
        )
          return (
            name +
            '=' +
            quote +
            escapeHtml(links[normalizedCopy(value)] ?? value) +
            quote
          );
        return attribute;
      },
    );
    if (
      ![
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr',
      ].includes(tag) &&
      !/\/\s*>$/.test(token)
    )
      stack.push({
        tag,
        protected:
          protectedRegion || ['code', 'pre', 'svg', 'textarea'].includes(tag),
      });
  }
  return result + copy(html.slice(cursor));
}
