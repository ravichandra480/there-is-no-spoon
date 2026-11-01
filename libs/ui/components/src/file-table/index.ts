import { define } from '../shared/define.js';
import { TinsFileTable } from './file-table.js';

export {
  TinsFileTable,
  isDownloadable,
  DEFAULT_ACTIONS,
  DEFAULT_COLUMNS,
} from './file-table.js';
export type {
  FileEntry,
  FileStatus,
  FileTableAction,
  FileTableColumn,
  TinsActionDetail,
  TinsDownloadDetail,
  TinsSelectionChangeDetail,
} from './file-table.js';

define('tins-file-table', TinsFileTable);

declare global {
  interface HTMLElementTagNameMap {
    'tins-file-table': TinsFileTable;
  }
  interface HTMLElementEventMap {
    'tins-action': CustomEvent<import('./file-table.js').TinsActionDetail>;
    'tins-download': CustomEvent<import('./file-table.js').TinsDownloadDetail>;
    'tins-selection-change': CustomEvent<
      import('./file-table.js').TinsSelectionChangeDetail
    >;
  }
}
