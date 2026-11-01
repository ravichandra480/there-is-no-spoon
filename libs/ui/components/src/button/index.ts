import { define } from '../shared/define.js';
import { TinsButton } from './button.js';

export { TinsButton } from './button.js';
export type {
  ButtonType,
  ButtonVariant,
  TinsButtonChangeDetail,
} from './button.js';

define('tins-button', TinsButton);

declare global {
  interface HTMLElementTagNameMap {
    'tins-button': TinsButton;
  }
  interface HTMLElementEventMap {
    'tins-change': CustomEvent<import('./button.js').TinsButtonChangeDetail>;
  }
}
