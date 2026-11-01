import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  type ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import '@tins/ui-components/button';
import { isDownloadable } from '@tins/ui-components/file-table';
import type {
  FileEntry,
  TinsDownloadDetail,
  TinsSelectionChangeDetail,
} from '@tins/ui-components/file-table';

/** Sample data for the showcase. */
export const SAMPLE_FILES: FileEntry[] = [
  {
    name: 'sync.exe',
    device: 'Atlas',
    path: '\\srv\\share2\\apps\\bin\\sync.exe',
    status: 'scheduled',
  },
  {
    name: 'agent.exe',
    device: 'Birch',
    path: '\\srv\\share2\\apps\\bin\\agent.exe',
    status: 'available',
  },
  {
    name: 'libcore.dll',
    device: 'Cedar',
    path: '\\srv\\share1\\apps\\bin\\libcore.dll',
    status: 'available',
  },
  {
    name: 'audio.sys',
    device: 'Delta',
    path: '\\srv\\share1\\apps\\bin\\audio.sys',
    status: 'scheduled',
  },
  {
    name: 'telemetry.dll',
    device: 'Ember',
    path: '\\srv\\share1\\apps\\bin\\telemetry.dll',
    status: 'scheduled',
  },
  {
    name: 'zip.exe',
    device: 'Fern',
    path: '\\srv\\share1\\tmp\\zip.exe',
    status: 'scheduled',
  },
];

@Component({
  selector: 'demo-file-table-page',
  templateUrl: './file-table.page.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FileTablePage {
  protected readonly files = SAMPLE_FILES;
  protected readonly scheduledOnly = SAMPLE_FILES.filter(
    (f) => !isDownloadable(f),
  );
  protected readonly noFiles: FileEntry[] = [];

  /** Files in the last download request, shown in the dialog. */
  protected readonly requested = signal<readonly FileEntry[]>([]);
  protected readonly selectedCount = signal(0);

  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('downloadDialog');
  private readonly closeButton =
    viewChild.required<ElementRef<HTMLElement>>('closeButton');

  protected readonly usage = `<tins-file-table id="files" label="Collected files"></tins-file-table>

<script type="module">
  import { isDownloadable } from '@tins/ui-components/file-table';
  const table = document.getElementById('files');
  table.files = [
    { name: 'agent.exe', device: 'Birch', path: '\\\\srv\\\\…\\\\agent.exe', status: 'available' },
    { name: 'sync.exe',  device: 'Atlas', path: '\\\\srv\\\\…\\\\sync.exe',  status: 'scheduled' },
  ];
  table.addEventListener('tins-download', (e) => {
    // Only available files can be downloaded; re-check before acting on the event.
    const files = e.detail.files.filter(isDownloadable);
    for (const file of files) console.log(file.device, file.path);
  });
</script>

<!-- Angular -->
<tins-file-table [files]="files" (tins-download)="onDownload($event)"></tins-file-table>`;

  protected onSelectionChange(event: Event): void {
    this.selectedCount.set(
      (event as CustomEvent<TinsSelectionChangeDetail>).detail.selected.length,
    );
  }

  protected onDownload(event: Event): void {
    // Defense in depth: the component only sends available files, but the host re-checks with the
    // same rule before acting, and does nothing when no downloadable file is left.
    const files = (
      event as CustomEvent<TinsDownloadDetail>
    ).detail.files.filter(isDownloadable);
    if (!files.length) return;
    this.requested.set(files);
    this.dialog().nativeElement.showModal();
    // Alert dialog: focus the least destructive (and only) action. `autofocus` covers most
    // browsers; focusing explicitly makes it reliable for the custom element (delegatesFocus).
    this.closeButton().nativeElement.focus();
  }

  protected closeDialog(): void {
    this.dialog().nativeElement.close();
  }
}
