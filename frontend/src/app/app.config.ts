import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';

import { routes } from './app.routes';

// Make Angular's date/number/currency pipes default to German formatting.
registerLocaleData(localeDe, 'de', localeDeExtra);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'de' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    // `withFetch()` makes HttpClient use the Fetch API, which is required for
    // proper SSR hydration without duplicate XHR requests on the client.
    provideHttpClient(withFetch()),
    provideClientHydration(
      withEventReplay(),
      // Cache GET responses during SSR and replay them on the client so the
      // browser doesn't refetch what the server already loaded.
      withHttpTransferCacheOptions({ includePostRequests: false }),
    ),
  ],
};
