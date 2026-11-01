/** DOM helpers that traverse open shadow roots (runs in a browser). */

export const INTERACTIVE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="menuitem"]',
].join(',');

/** querySelectorAll that also searches inside every open shadow root below `root`. */
export function deepQueryAll(root: Element | ShadowRoot | Document, selector: string): Element[] {
  const out: Element[] = [];
  const visit = (node: Element | ShadowRoot | Document) => {
    if (node instanceof Element && node.matches(selector)) out.push(node);
    const children = node instanceof Element && node.shadowRoot ? [node.shadowRoot, ...node.children] : [...node.children];
    for (const child of children) visit(child as Element | ShadowRoot);
  };
  visit(root);
  return out;
}

/** Returns every open shadow root at or below `root`. */
export function allShadowRoots(root: Element | Document): ShadowRoot[] {
  return deepQueryAll(root, '*')
    .map((el) => el.shadowRoot)
    .filter((sr): sr is ShadowRoot => sr !== null);
}

/** The focused element, following `activeElement` through shadow roots. */
export function deepActiveElement(doc: Document = document): Element | null {
  let active: Element | null = doc.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

export function isRendered(el: Element): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

export function isDisabled(el: Element): boolean {
  return el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true';
}

/** Parent across shadow boundaries. */
export function composedParent(el: Element): Element | null {
  if (el.parentElement) return el.parentElement;
  const root = el.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

/** True if `ancestor` contains `node` in the composed (flattened) tree, following slots and shadow hosts. */
export function composedContains(ancestor: Element, node: Element): boolean {
  for (let cur: Element | null = node; cur; cur = cur.assignedSlot ?? composedParent(cur)) {
    if (cur === ancestor) return true;
  }
  return false;
}

/** First non-transparent background color found walking up composed ancestors (defaults to white). */
export function effectiveBackground(el: Element): string {
  for (let cur: Element | null = el; cur; cur = composedParent(cur)) {
    const bg = getComputedStyle(cur).backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) return bg;
  }
  return 'rgb(255, 255, 255)';
}
