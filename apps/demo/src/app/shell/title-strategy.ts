import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE_NAME = 'tins components demo';

/** Page titles describe the page first, then the site (WCAG 2.4.2). */
@Injectable({ providedIn: 'root' })
export class DemoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} · ${SITE_NAME}` : SITE_NAME);
  }
}
