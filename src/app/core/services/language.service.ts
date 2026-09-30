import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'ar' | 'en';

const STORAGE_KEY = 'cp_lang';
const DIR_BY_LANG: Record<AppLang, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' };

/**
 * Thin wrapper around TranslateService that also owns direction (RTL/LTR),
 * <html lang>, and persistence — so every part of the shell (fonts, Bootstrap
 * logical properties, our own SCSS) reacts to one Signal instead of each
 * screen re-implementing the switch.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  readonly lang = signal<AppLang>(this.readInitial());

  constructor() {
    this.translate.addLangs(['ar', 'en']);
    this.apply(this.lang());
  }

  use(lang: AppLang): void {
    this.lang.set(lang);
    this.apply(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  toggle(): void {
    this.use(this.lang() === 'ar' ? 'en' : 'ar');
  }

  dir(): 'rtl' | 'ltr' {
    return DIR_BY_LANG[this.lang()];
  }

  private apply(lang: AppLang): void {
    this.translate.use(lang).subscribe();
    document.documentElement.lang = lang;
    document.documentElement.dir = DIR_BY_LANG[lang];
    this.applyBootstrapStylesheet(lang);
  }

  /**
   * Bootstrap ships two build-time-compiled stylesheets (regular = LTR physical
   * properties, .rtl = RTL physical properties) rather than one that adapts at
   * runtime. Since the app switches direction live, we swap which compiled file
   * is loaded here — mirrored by the inline anti-FOUC script in index.html for
   * the very first paint, before this service exists.
   */
  private applyBootstrapStylesheet(lang: AppLang): void {
    const link = document.getElementById('bootstrap-css') as HTMLLinkElement | null;
    if (!link) return;
    link.href = lang === 'en' ? 'assets/bootstrap/bootstrap.min.css' : 'assets/bootstrap/bootstrap.rtl.min.css';
  }

  private readInitial(): AppLang {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLang | null;
    return stored === 'en' || stored === 'ar' ? stored : 'ar';
  }
}
