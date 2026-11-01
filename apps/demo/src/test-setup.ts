import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
// Real theme + global styles, so contrast, focus and target-size checks see what users see.
import '@tins/ui-tokens/tokens.css';
import './styles.scss';

setupTestBed({ zoneless: true });
