/** Inspect authored visible copy and control surfaces inside page.evaluate.
 * Required notation belongs in code. User output belongs in data-user-content.
 * A specific data-copy-notation value must describe an unavoidable notation.
 * @returns {{kind: string, text: string, element: string}[]} */
export function inspectInterface() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  const acronyms = new Set([
    'HTML',
    'CSS',
    'API',
    'AI',
    'SI',
    'JSON',
    'ZIP',
    'TAR',
    'AES',
    'URL',
    'QR',
    'SMS',
    'PDF',
    'PNG',
    'SVG',
    'ICO',
    'PHAR',
    'UTF',
    'RGB',
    'HSL',
    'HSV',
    'CMYK',
    'HTTP',
    'HTTPS',
    'SQL',
    'WPA',
    'WPA2',
    'WEP',
    'WGS',
    'SEO',
    'AEO',
    'GEO',
    'WCAG',
    'VINASIG',
    'CDC',
    'WHO',
    'NHS',
    'NVQS',
    'BMI',
    'KB',
    'MB',
    'GB',
    'TB',
    'AM',
    'PM',
  ]);
  /** @param {Element} element */
  function visible(element) {
    const style = getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.getClientRects().length > 0
    );
  }
  /** @param {Element} element @param {string} text @param {string} kind */
  function add(element, text, kind) {
    findings.push({
      kind,
      text,
      element: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
    });
  }
  /** @param {Element} element @param {string} raw */
  function inspect(element, raw) {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (text.includes(';')) add(element, text, 'semicolon');
    if (/[–—]/.test(text)) add(element, text, 'long-dash');
    if (/\s\/\s/.test(text)) add(element, text, 'slash-separator');
    if (/:\s/.test(text)) add(element, text, 'label-colon');
    if (/\([^)]*[\p{L}][^)]*\)/u.test(text))
      add(element, text, 'parenthetical-copy');
    const words =
      text.replace(/#[a-f\d]{3,8}\b/gi, '').match(/\p{L}{2,}/gu) ?? [];
    if (
      words.length &&
      words.every((word) => word === word.toUpperCase()) &&
      words.some((word) => !acronyms.has(word))
    )
      add(element, text, 'all-caps-copy');
    if (getComputedStyle(element).textTransform === 'uppercase' && words.length)
      add(element, text, 'uppercase-style');
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (const element of document.querySelectorAll('[data-copy-notation]')) {
    if (
      !['SPAN', 'A', 'P', 'INPUT', 'TEXTAREA', 'ABBR', 'TIME'].includes(
        element.tagName,
      ) ||
      (element.getAttribute('data-copy-notation')?.trim().length ?? 0) < 3 ||
      (element.textContent?.length ?? 0) > 200 ||
      element.children.length > 1
    )
      add(
        element,
        element.textContent?.trim() ?? '',
        'invalid-notation-exception',
      );
  }
  while (walker.nextNode()) {
    const element = walker.currentNode.parentElement;
    if (
      !element ||
      !visible(element) ||
      element.closest(
        'script,style,svg,pre,code,textarea,[data-user-content],[data-copy-notation]',
      )
    )
      continue;
    inspect(element, walker.currentNode.textContent ?? '');
  }
  for (const element of document.querySelectorAll(
    'input[placeholder],textarea[placeholder]',
  )) {
    if (visible(element) && !element.closest('[data-copy-notation]'))
      inspect(element, element.getAttribute('placeholder') ?? '');
  }
  for (const element of document.querySelectorAll('li')) {
    if (
      visible(element) &&
      ['disc', 'circle', 'square'].includes(
        getComputedStyle(element).listStyleType,
      )
    )
      add(element, element.textContent?.trim() ?? '', 'default-list-marker');
  }
  for (const element of document.querySelectorAll(
    'select,input[type="date"],input[type="time"],input[type="color"]',
  )) {
    if (visible(element))
      add(element, element.getAttribute('type') ?? 'select', 'platform-popup');
  }
  for (const element of document.querySelectorAll('input[type="range"]')) {
    if (visible(element) && getComputedStyle(element).appearance !== 'none')
      add(element, 'range', 'platform-slider');
  }
  return findings;
}
