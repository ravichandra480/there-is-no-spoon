import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { scss } from '../shared/styles.js';
import styles from './button.styles.scss?inline';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonType = 'button' | 'submit' | 'reset';

export interface TinsButtonChangeDetail {
  pressed: boolean;
}

/**
 * Accessible button. Renders a native `<button>` in its shadow root, takes part in forms,
 * and can act as a toggle button (`aria-pressed`).
 *
 * @tag tins-button
 * @summary Button with primary/secondary variants, toggle mode and icon-only support.
 *
 * @slot - Visible label.
 * @slot icon - Optional decorative icon shown before the label. Mark the icon `aria-hidden="true"`.
 *
 * @csspart button - The native button element.
 * @csspart label - Wrapper around the default slot.
 *
 * @cssprop [--tins-color-primary] - Primary fill / secondary label and border color.
 * @cssprop [--tins-color-primary-hover] - Primary fill on hover.
 * @cssprop [--tins-color-on-primary] - Primary label color.
 * @cssprop [--tins-color-surface] - Secondary fill.
 * @cssprop [--tins-color-focus-ring] - Focus indicator color.
 * @cssprop [--tins-target-size] - Minimum width/height (default 44px).
 *
 * @fires {CustomEvent<TinsButtonChangeDetail>} tins-change - Toggle buttons only: fired after `pressed` changes from user interaction. Bubbles and is composed.
 */
export class TinsButton extends LitElement {
  static override styles = scss(styles);
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static formAssociated = true;

  static override properties = {
    variant: { type: String, reflect: true },
    type: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    toggle: { type: Boolean, reflect: true },
    pressed: { type: Boolean, reflect: true },
    label: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String },
  };

  /** Visual style. @attr variant */
  declare variant: ButtonVariant;
  /** Form behaviour, as on a native button. @attr type */
  declare type: ButtonType;
  /** Disables the button. Disabled buttons are skipped by Tab and ignore activation. @attr disabled */
  declare disabled: boolean;
  /** Makes the button a toggle button exposing `aria-pressed`. @attr toggle */
  declare toggle: boolean;
  /** Pressed state of a toggle button. @attr pressed */
  declare pressed: boolean;
  /** Accessible name. Required for icon-only buttons; otherwise the slotted text is the name. @attr label */
  declare label: string | undefined;
  /** Name submitted with the form when this button submits it. @attr name */
  declare name: string | undefined;
  /** Value submitted with the form when this button submits it. */
  declare value: string;

  readonly #internals: ElementInternals;

  constructor() {
    super();
    this.variant = 'primary';
    this.type = 'button';
    this.disabled = false;
    this.toggle = false;
    this.pressed = false;
    this.value = '';
    this.#internals = this.attachInternals();
    // Capture phase on the host so listeners never see clicks while disabled.
    this.addEventListener('click', this.#onHostClick, { capture: true });
  }

  /** The form this button belongs to, if any. */
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  override focus(options?: FocusOptions): void {
    this.#button?.focus(options);
  }

  override click(): void {
    if (!this.disabled) this.#button?.click();
  }

  get #button(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('button') ?? null;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('disabled'))
      this.#internals.ariaDisabled = this.disabled ? 'true' : null;
  }

  #onHostClick = (event: Event): void => {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  #onClick = (): void => {
    if (this.disabled) return;
    if (this.toggle) {
      this.pressed = !this.pressed;
      this.dispatchEvent(
        new CustomEvent<TinsButtonChangeDetail>('tins-change', {
          bubbles: true,
          composed: true,
          detail: { pressed: this.pressed },
        }),
      );
    }
    const form = this.#internals.form;
    if (!form) return;
    if (this.type === 'submit') {
      // Submit with this button's name/value via a temporary native submitter.
      const submitter = document.createElement('button');
      submitter.type = 'submit';
      submitter.hidden = true;
      if (this.name) {
        submitter.name = this.name;
        submitter.value = this.value;
      }
      form.append(submitter);
      form.requestSubmit(submitter);
      submitter.remove();
    } else if (this.type === 'reset') {
      form.reset();
    }
  };

  protected override render() {
    return html`<button
      part="button"
      type="button"
      ?disabled=${this.disabled}
      aria-pressed=${this.toggle ? String(this.pressed) : nothing}
      aria-label=${this.label || nothing}
      @click=${this.#onClick}
    >
      <slot name="icon"></slot><span part="label"><slot></slot></span>
    </button>`;
  }
}
