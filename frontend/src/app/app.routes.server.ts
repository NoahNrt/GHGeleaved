import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server-side render every route on demand instead of prerendering at build
 * time. Prerendering would try to fetch reviews from Strapi during `ng build`,
 * which breaks if the backend isn't running. SSR keeps the build self-contained
 * and still gives us per-request HTML with full data hydration.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
