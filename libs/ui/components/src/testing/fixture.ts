import type { LitElement } from 'lit';

const mounted: HTMLElement[] = [];

/** Renders `html` into the document and waits for every Lit element in it to finish rendering. */
export async function fixture<T extends Element = HTMLElement>(
  markup: string,
): Promise<T> {
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.append(container);
  mounted.push(container);
  await settle(container);
  return container.firstElementChild as T;
}

export async function settle(root: Element): Promise<void> {
  const els = [root, ...root.querySelectorAll('*')].filter(
    (e): e is LitElement => 'updateComplete' in e,
  );
  await Promise.all(els.map((e) => e.updateComplete));
}

export function cleanup(): void {
  mounted.splice(0).forEach((c) => c.remove());
}

export const shadow = (el: Element, selector: string) =>
  el.shadowRoot?.querySelector(selector) ?? null;
