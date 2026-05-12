import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { StrapiService } from './strapi.service';
import type {
  Comment,
  NewComment,
  StrapiCollectionResponse,
  StrapiSingleResponse,
} from '../models/review.model';

/**
 * Read access lists only approved comments — the backend's custom controller
 * filters `find` to `approved=true` for the public role. Writing a new
 * comment always lands as `approved=false`, regardless of what the client
 * sends; the admin has to flip the flag in the Strapi panel.
 */
@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly strapi = inject(StrapiService);

  /** Approved comments on a single review, oldest first (most natural for threads). */
  getForReview(reviewId: number): Observable<Comment[]> {
    const url = this.strapi.apiUrl('/comments', {
      'filters[review][id][$eq]': reviewId,
      'sort': 'createdAt:asc',
      'pagination[pageSize]': 100,
    });
    return this.http
      .get<StrapiCollectionResponse<Comment>>(url)
      .pipe(map((res) => res.data));
  }

  /**
   * Submit a new comment. The server forces `approved: false` on every
   * incoming POST; the returned record reflects that and is therefore
   * NOT shown in the public list until an admin approves it.
   */
  create(input: NewComment): Observable<Comment> {
    const url = this.strapi.apiUrl('/comments');
    return this.http
      .post<StrapiSingleResponse<Comment>>(url, { data: input })
      .pipe(map((res) => res.data));
  }
}
