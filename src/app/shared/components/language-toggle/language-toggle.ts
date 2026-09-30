import { Component, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="btn btn-outline-secondary d-flex align-items-center justify-content-center fw-bold"
      style="width: 40px; height: 40px; font-size: .75rem;"
      (click)="lang.toggle()"
      [attr.aria-label]="lang.lang() === 'ar' ? 'Switch to English' : 'التبديل للعربية'"
      title="EN / عربي"
    >
      {{ lang.lang() === 'ar' ? 'EN' : 'ع' }}
    </button>
  `,
})
export class LanguageToggle {
  protected lang = inject(LanguageService);
}
