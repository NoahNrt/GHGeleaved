import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoOptions {
  /** Page title. The site name suffix is appended automatically. */
  title: string;
  /** Meta description — also used as the OpenGraph and Twitter description. */
  description?: string;
  /** Absolute URL of an image used by social-media previews. */
  image?: string;
  /** OG type, e.g. `website`, `article`. Defaults to `website`. */
  type?: 'website' | 'article';
}

const SITE_NAME = 'Roter Dorn';

/**
 * Centralized SEO updates so every page sets title + description + Open Graph
 * the same way. Using Angular's `Title` and `Meta` services rather than direct
 * DOM access keeps everything SSR-safe.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  update(options: SeoOptions): void {
    const fullTitle =
      options.title === SITE_NAME ? SITE_NAME : `${options.title} — ${SITE_NAME}`;
    this.title.setTitle(fullTitle);

    this.upsertMeta('description', options.description);
    this.upsertMeta('og:title', fullTitle, true);
    this.upsertMeta('og:site_name', SITE_NAME, true);
    this.upsertMeta('og:type', options.type ?? 'website', true);
    this.upsertMeta('og:description', options.description, true);
    this.upsertMeta('og:image', options.image, true);

    this.upsertMeta('twitter:card', options.image ? 'summary_large_image' : 'summary');
    this.upsertMeta('twitter:title', fullTitle);
    this.upsertMeta('twitter:description', options.description);
    this.upsertMeta('twitter:image', options.image);
  }

  /** Add or update a meta tag, removing it when `content` is falsy. */
  private upsertMeta(name: string, content: string | undefined | null, property = false): void {
    const selector = property ? `property="${name}"` : `name="${name}"`;
    if (!content) {
      this.meta.removeTag(selector);
      return;
    }
    const attr = property ? 'property' : 'name';
    this.meta.updateTag({ [attr]: name, content });
  }
}
