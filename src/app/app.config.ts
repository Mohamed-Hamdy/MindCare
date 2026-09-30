import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateHttpLoader, TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    // Registers TRANSLATE_HTTP_LOADER_CONFIG only — the TranslateLoader binding it also
    // returns would otherwise be shadowed by provideTranslateService()'s own default
    // (TranslateNoOpLoader) since that call comes later in this array. We instead point
    // provideTranslateService's `loader` slot directly at TranslateHttpLoader below, which
    // picks up this config via DI.
    ...provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
    provideTranslateService({ lang: 'ar', fallbackLang: 'ar', loader: provideTranslateLoader(TranslateHttpLoader) }),
  ],
};
