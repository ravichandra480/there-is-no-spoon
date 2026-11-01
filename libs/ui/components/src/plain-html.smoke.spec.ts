import { afterEach, describe, expect, it } from 'vitest';

/**
 * Spec: web-component-library › "Use in plain HTML".
 * Loads the *built* bundle (dist, not src) into a fresh iframe — its own document and custom element
 * registry, no framework, no test fixture — and checks that `<tins-button>` upgrades and is clickable.
 * The iframe is served by the Vitest (Vite) server, which resolves the bundle's bare `lit` import, so
 * this does not prove that a static page works. `plain-html.static.node.spec.ts` covers that, using a
 * plain HTTP server and the README's import map.
 */
declare const __TINS_DIST__: string;

let frame: HTMLIFrameElement | undefined;
afterEach(() => frame?.remove());

function loadPlainPage(body: string, script: string): Promise<Window> {
  frame = document.createElement('iframe');
  frame.title = 'plain HTML smoke test';
  frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>smoke</title>
<script type="module" src="/@fs${__TINS_DIST__}/${script}"></script></head><body>${body}</body></html>`;
  document.body.append(frame);
  return new Promise((resolve, reject) => {
    frame!.addEventListener('load', () => resolve(frame!.contentWindow!), {
      once: true,
    });
    frame!.addEventListener('error', reject, { once: true });
  });
}

async function waitFor<T>(fn: () => T | undefined, timeout = 5000): Promise<T> {
  const start = performance.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (performance.now() - start > timeout) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe('built bundle in plain HTML', () => {
  it('upgrades <tins-button> and it is clickable without any framework', async () => {
    const win = await loadPlainPage(
      '<tins-button id="b">Save</tins-button>',
      'button.js',
    );
    const doc = win.document;

    const ctor = await waitFor(() => win.customElements.get('tins-button'));
    await win.customElements.whenDefined('tins-button');
    const el = doc.getElementById('b') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    expect(el).toBeInstanceOf(ctor);
    await el.updateComplete;

    // No framework runtime on the page.
    expect('ng' in win || 'React' in win || 'Vue' in win).toBe(false);

    const inner = el.shadowRoot?.querySelector('button');
    expect(inner?.textContent).toBeDefined();
    let clicks = 0;
    el.addEventListener('click', () => clicks++);
    inner?.click();
    expect(clicks).toBe(1);
  });
});
