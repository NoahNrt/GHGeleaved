import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { StrapiService } from './strapi.service';
import type {
  Genre,
  Review,
  StrapiCollectionResponse,
  StrapiSingleResponse,
} from '../models/review.model';

/**
 * Read access to Review entities exposed by Strapi at `/api/reviews`.
 *
 * All methods request `populate=cover` so the image is included in the
 * response — relations are not populated by default in Strapi 5.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly strapi = inject(StrapiService);

  /** Newest published reviews first, optionally limited. */
  getLatest(limit = 12): Observable<Review[]> {
    const url = this.strapi.apiUrl('/reviews', {
      'populate': 'cover',
      'sort': 'publishedAt:desc',
      'pagination[pageSize]': limit,
    });
    return this.http
      .get<StrapiCollectionResponse<Review>>(url)
      .pipe(map((res) => res.data));
  }

  /** All reviews in a single genre, newest first. */
  getByGenre(genre: Genre, limit = 24): Observable<Review[]> {
    const url = this.strapi.apiUrl('/reviews', {
      'populate': 'cover',
      'sort': 'publishedAt:desc',
      'filters[genre][$eq]': genre,
      'pagination[pageSize]': limit,
    });
    return this.http
      .get<StrapiCollectionResponse<Review>>(url)
      .pipe(map((res) => res.data));
  }

  /**
   * Fetch a single review by its slug. Strapi returns an array even for unique
   * slugs, so we unwrap to a single entity or `null`.
   *
   * Uses `populate=*` so the cover image *and* any media referenced from the
   * Blocks body field are returned inline — without this, image blocks in the
   * rich-text body show up without a usable `url`.
   */
  getBySlug(slug: string): Observable<Review | null> {
    const url = this.strapi.apiUrl('/reviews', {
      'populate': '*',
      'filters[slug][$eq]': slug,
      'pagination[pageSize]': 1,
    });
    return this.http
      .get<StrapiCollectionResponse<Review>>(url)
      .pipe(map((res) => res.data[0] ?? null));
  }

  /** Fetch by numeric id — useful for admin-style flows. */
  getById(id: number): Observable<Review | null> {
    const url = this.strapi.apiUrl(`/reviews/${id}`, { populate: 'cover' });
    return this.http
      .get<StrapiSingleResponse<Review>>(url)
      .pipe(map((res) => res.data ?? null));
  }
}
