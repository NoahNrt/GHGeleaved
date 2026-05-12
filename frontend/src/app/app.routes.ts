import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { GenreList } from './pages/genre-list/genre-list';
import { NotFound } from './pages/not-found/not-found';

/**
 * Route map.
 *
 *   /                       Home — latest reviews across all genres
 *   /:genre                 GenreList — filtered by genre param (validated)
 *   /:genre/:slug           ReviewDetail — added in Phase 3
 *   /**                     NotFound
 *
 * `pathMatch: 'full'` on the empty path makes sure `/` doesn't accidentally
 * swallow longer URLs.
 */
export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'Roter Dorn — Reviews' },
  { path: ':genre', component: GenreList },
  { path: '**', component: NotFound, title: 'Nicht gefunden' },
];
