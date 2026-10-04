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
    if (text.includes('•')) add(element, text, 'round-bullet');
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

/** Measure ordinary select indicators in initial and enhanced HTML. */
export function inspectControlIndicators() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  /** @param {Element} element */
  const visible = (element) => {
    const style = getComputedStyle(element);
    if (
      style.display === 'none' ||
      style.visibility !== 'visible' ||
      !element.getClientRects().length
    )
      return false;
    /** @type {Element | null} */
    let ancestor = element;
    while (ancestor) {
      if (
        ancestor instanceof HTMLDetailsElement &&
        !ancestor.open &&
        !ancestor.querySelector('summary')?.contains(element)
      )
        return false;
      ancestor = ancestor.parentElement;
    }
    return true;
  };
  const controls = new Set(document.querySelectorAll('.select-control'));
  for (const indicator of document.querySelectorAll(
    '[data-control-indicator]',
  )) {
    const control = indicator.closest('button, [role="combobox"]');
    if (control) controls.add(control);
  }
  for (const control of controls) {
    if (!visible(control)) continue;
    /** @param {string} kind @param {string} text */
    const add = (kind, text) =>
      findings.push({
        kind,
        text,
        element: control.id || control.tagName.toLowerCase(),
      });
    const indicator = control.querySelector('[data-control-indicator]');
    const value = control.querySelector('[data-control-value]');
    if (!indicator || !value) {
      add(
        'control-indicator-markup',
        'Missing measurable selected value or indicator',
      );
      continue;
    }
    if (!visible(indicator) || !visible(value)) {
      add('control-indicator-hidden', 'Selected value or indicator is hidden');
      continue;
    }
    const box = control.getBoundingClientRect();
    const icon = indicator.getBoundingClientRect();
    const text = value.getBoundingClientRect();
    const style = getComputedStyle(control);
    const left = box.left + parseFloat(style.borderLeftWidth);
    const right = box.right - parseFloat(style.borderRightWidth);
    const rtl = style.direction === 'rtl';
    const inset = rtl ? icon.left - left : right - icon.right;
    const gap = rtl ? text.left - icon.right : icon.left - text.right;
    // Only accommodate floating point representation, never a layout pixel.
    const epsilon = 0.01;
    if (inset + epsilon < 16)
      add(
        'control-indicator-inset',
        `Trailing inset is ${inset.toFixed(2)} CSS px, expected at least 16`,
      );
    if (gap + epsilon < 12)
      add(
        'control-indicator-gap',
        `Value gap is ${gap.toFixed(2)} CSS px, expected at least 12`,
      );
    const declaredWidth = Number(indicator.getAttribute('width'));
    const declaredHeight = Number(indicator.getAttribute('height'));
    if (
      !(declaredWidth > 0 && declaredHeight > 0) ||
      icon.width + epsilon < declaredWidth ||
      icon.height + epsilon < declaredHeight
    )
      add(
        'control-indicator-size',
        'Indicator must keep its declared dimensions',
      );
    if (
      icon.left < left - epsilon ||
      icon.right > right + epsilon ||
      icon.top < box.top + parseFloat(style.borderTopWidth) - epsilon ||
      icon.bottom >
        box.bottom - parseFloat(style.borderBottomWidth) + epsilon ||
      text.left < left - epsilon ||
      text.right > right + epsilon ||
      value.scrollWidth > text.width + 1
    )
      add(
        'control-indicator-clipping',
        'Value or indicator exceeds its control',
      );
  }
  return findings;
}

/** Inspect the explicit VINASIG header logo after its image has loaded.
 * The consumer must separately pin and verify the original asset bytes.
 * This checks presentation, variant selection and geometry, not artwork rights.
 * @returns {{kind: string, text: string, element: string}[]} */
export function inspectHeaderBrand() {
  /** @type {{kind: string, text: string, element: string}[]} */
  const findings = [];
  const links = [...document.querySelectorAll('[data-brand-logo]')];
  /** @param {Element} element @param {string} kind @param {string} text */
  const add = (element, kind, text) =>
    findings.push({
      kind,
      text,
      element: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
    });
  if (links.length !== 1) {
    findings.push({
      kind: 'header-logo-count',
      text: String(links.length),
      element: '[data-brand-logo]',
    });
    return findings;
  }
  const link = links[0];
  if (!link) return findings;
  if (!(link instanceof HTMLAnchorElement) || !link.href)
    add(link, 'header-logo-link', 'Use a named logo link');
  else if (link.href !== 'https://vinasig.io.vn/')
    add(
      link,
      'header-logo-home',
      'The VINASIG logo must link to https://vinasig.io.vn/',
    );
  const image = link.querySelector('img');
  if (!image || !image.complete || image.naturalWidth === 0) {
    add(link, 'header-logo-image', 'The supplied image must load');
    return findings;
  }
  if (!image.alt.trim())
    add(image, 'header-logo-name', 'The logo needs alternative text');
  for (const element of [link, ...link.querySelectorAll('picture,img')]) {
    const style = getComputedStyle(element);
    const rgba = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    if (rgba.length === 3 || (rgba[3] ?? 0) > 0)
      add(element, 'header-logo-background', style.backgroundColor);
    if (
      style.backgroundImage !== 'none' ||
      style.boxShadow !== 'none' ||
      style.filter !== 'none' ||
      Number(style.opacity) !== 1
    )
      add(
        element,
        'header-logo-effect',
        'Keep the original artwork without panel effects',
      );
    if (
      [
        style.paddingTop,
        style.paddingRight,
        style.paddingBottom,
        style.paddingLeft,
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ].some((value) => parseFloat(value) > 0.5)
    )
      add(
        element,
        'header-logo-frame',
        'Use surrounding layout spacing without a padded logo card',
      );
    if (
      element === image &&
      [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomLeftRadius,
        style.borderBottomRightRadius,
      ].some((value) => parseFloat(value) > 0)
    )
      add(element, 'header-logo-crop', 'Keep the complete unrounded artwork');
  }
  const target = link.getBoundingClientRect();
  if (target.width < 44 || target.height < 44)
    add(link, 'header-logo-target', `${target.width} x ${target.height}`);
  const bounds = image.getBoundingClientRect();
  // The supported original horizontal exports share this reviewed viewBox.
  // Their percentage dimensions produce rounded naturalWidth/naturalHeight
  // values that differ between engines. Do not infer the artwork ratio from
  // that raster fallback or request an asset during a user's local workflow.
  const ratio = 540 / 140;
  const declaredWidth = Number(image.getAttribute('width'));
  const declaredHeight = Number(image.getAttribute('height'));
  if (
    declaredWidth <= 0 ||
    declaredHeight <= 0 ||
    Math.abs(declaredWidth / declaredHeight - ratio) > 0.0001
  )
    add(
      image,
      'header-logo-intrinsic-ratio',
      'Declare the original aspect ratio',
    );
  if (
    bounds.height <= 0 ||
    Math.abs(bounds.width / bounds.height - ratio) > 0.02
  )
    add(image, 'header-logo-ratio', 'Preserve the original image aspect ratio');
  /** @type {number | undefined} */
  let luminance;
  for (
    let surface = link.parentElement;
    surface;
    surface = surface.parentElement
  ) {
    const style = getComputedStyle(surface);
    const rgba = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    if (
      !style.backgroundColor.startsWith('rgb') ||
      rgba.length < 3 ||
      (rgba[3] ?? 1) < 0.99
    )
      continue;
    const linear = rgba.slice(0, 3).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    luminance =
      (linear[0] ?? 0) * 0.2126 +
      (linear[1] ?? 0) * 0.7152 +
      (linear[2] ?? 0) * 0.0722;
    break;
  }
  if (luminance === undefined)
    add(link, 'header-logo-surface', 'Inspect the actual logo surface');
  else {
    const filename = new URL(image.currentSrc || image.src).pathname
      .split('/')
      .pop();
    const supported =
      luminance < 0.179
        ? ['reversed.svg', 'monochrome-white.svg']
        : ['primary-color.svg', 'color-black.svg', 'monochrome-black.svg'];
    if (!filename || !supported.includes(filename))
      add(
        image,
        'header-logo-variant',
        `${filename ?? 'unknown'} on ${luminance < 0.179 ? 'dark' : 'light'} surface`,
      );
  }
  return findings;
}
