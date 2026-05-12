import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { GenreList } from './pages/genre-list/genre-list';
import { ReviewDetail } from './pages/review-detail/review-detail';
import { NotFound } from './pages/not-found/not-found';

/**
 * Route map.
 *
 *   /                       Home — latest reviews across all genres
 *   /redaktion              About page (static)
 *   /:genre                 GenreList — filtered by genre param (validated)
 *   /:genre/:slug           ReviewDetail — single review + comments
 *   /**                     NotFound
 *
 * `/redaktion` must come BEFORE `/:genre`, otherwise the param route would
 * eat the literal segment and fall through to the inline 404 inside
 * GenreList. Angular matches routes top-down — literal paths first wins.
 */
export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'Roter Dorn — Reviews' },
  { path: 'redaktion', component: About, title: 'Redaktion — Roter Dorn' },
  { path: ':genre', component: GenreList },
  { path: ':genre/:slug', component: ReviewDetail },
  { path: '**', component: NotFound, title: 'Nicht gefunden — Roter Dorn' },
];
