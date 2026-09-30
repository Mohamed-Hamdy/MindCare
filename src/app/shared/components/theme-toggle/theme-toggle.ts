import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
      style="width: 40px; height: 40px;"
      (click)="theme.toggle()"
      [attr.aria-label]="(theme.mode() === 'dark' ? 'common.switchToLight' : 'common.switchToDark') | translate"
      [attr.title]="'common.toggleThemeTitle' | translate"
    >
      <i class="bi" [class.bi-moon-stars-fill]="theme.mode() === 'light'" [class.bi-sun-fill]="theme.mode() === 'dark'"></i>
    </button>
  `,
})
export class ThemeToggle {
  protected theme = inject(ThemeService);
}
