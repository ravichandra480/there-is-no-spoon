import { describe, expect, it } from 'vitest';
import { define } from './define.js';

class A extends HTMLElement {}
class B extends HTMLElement {}

describe('define', () => {
  it('registers an element and returns the constructor', () => {
    expect(define('tins-test-a', A)).toBe(A);
    expect(customElements.get('tins-test-a')).toBe(A);
  });

  it('is a no-op (and does not throw) when the tag is already defined', () => {
    expect(() => define('tins-test-a', B)).not.toThrow();
    expect(customElements.get('tins-test-a')).toBe(A);
  });

  it('importing a component module twice does not throw', async () => {
    await import('../button/index.js');
    await expect(
      import('../button/index.js?again' as string),
    ).resolves.toBeDefined();
    expect(customElements.get('tins-button')).toBeDefined();
  });

  it('gives typed results for querySelector', async () => {
    const { TinsButton } = await import('../button/index.js');
    document.body.innerHTML = '<tins-button>x</tins-button>';
    // Compile-time check: HTMLElementTagNameMap maps the tag to the class.
    const el: InstanceType<typeof TinsButton> | null =
      document.querySelector('tins-button');
    expect(el).toBeInstanceOf(TinsButton);
    document.body.innerHTML = '';
  });
});
