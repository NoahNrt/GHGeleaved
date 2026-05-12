import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import type { Review, StrapiImage } from '../models/review.model';

/**
 * Shared helpers for talking to the Strapi backend:
 *   - canonical base URL from `environment.strapiUrl`
 *   - absolute URL helper for Strapi's relative media paths
 *   - typed builder for `?populate=…` and filter query strings
 *
 * Concrete API calls live in feature-specific services (e.g. ReviewService)
 * that compose URLs via this service.
 */
@Injectable({ providedIn: 'root' })
export class StrapiService {
  readonly baseUrl = environment.strapiUrl.replace(/\/+$/, '');

  /** Build a full API URL: `apiUrl('/reviews')` → `http://host/api/reviews`. */
  apiUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const qs = this.buildQueryString(params);
    return `${this.baseUrl}/api${cleanPath}${qs}`;
  }

  /**
   * Strapi serves uploaded media with a relative URL (e.g. `/uploads/cover.jpg`).
   * Prepend the backend host so the browser can fetch them across origins.
   * If a fully-qualified URL comes in (e.g. from a CDN-backed upload provider),
   * pass it through unchanged.
   */
  mediaUrl(image: StrapiImage | string | null | undefined): string | null {
    if (!image) return null;
    const url = typeof image === 'string' ? image : image.url;
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  /**
   * Pick the best cover image URL for a review:
   *   1. A Strapi Media upload, when an admin has attached one in the panel.
   *   2. An external `coverUrl` (e.g. legacy WordPress upload).
   *   3. `null` — caller should render a placeholder.
   */
  coverUrlFor(review: Pick<Review, 'cover' | 'coverUrl'> | null | undefined): string | null {
    if (!review) return null;
    return this.mediaUrl(review.cover) ?? this.mediaUrl(review.coverUrl);
  }

  private buildQueryString(params?: Record<string, string | number | undefined>): string {
    if (!params) return '';
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
    if (entries.length === 0) return '';
    const qs = entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return `?${qs}`;
  }
}
