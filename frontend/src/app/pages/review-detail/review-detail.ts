import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { ReviewService } from '../../services/review.service';
import { StrapiService } from '../../services/strapi.service';
import { SeoService } from '../../services/seo.service';
import { BlocksRenderer } from '../../shared/blocks-renderer/blocks-renderer';
import { CommentList } from '../../shared/comment-list/comment-list';
import { CommentForm } from '../../shared/comment-form/comment-form';
import { NotFound } from '../not-found/not-found';
import { GENRE_LABELS, GENRE_LABELS_SINGULAR } from '../../models/review.model';
import type { Review } from '../../models/review.model';

/**
 * Single-review page reached at `/<genre>/<slug>`.
 *
 * The route param `:genre` must match the review's actual genre — otherwise
 * the URL would happily render `/film/some-book-slug` and confuse the
 * breadcrumb. We treat a mismatch as a 404.
 *
 * Loading states: while the request is in flight, `review()` is `undefined`.
 * After the response, it's either a `Review` or `null` (not found).
 */
@Component({
  selector: 'app-review-detail',
  imports: [BlocksRenderer, CommentList, CommentForm, NotFound, RouterLink, DatePipe],
  templateUrl: './review-detail.html',
  styleUrl: './review-detail.css',
})
export class ReviewDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly reviewService = inject(ReviewService);
  private readonly strapi = inject(StrapiService);
  private readonly seo = inject(SeoService);

  /** Stream of (`genre`, `slug`) — re-fires whenever the URL changes. */
  private readonly params = toSignal(
    this.route.paramMap.pipe(
      map((p) => ({
        genre: p.get('genre') ?? '',
        slug: p.get('slug') ?? '',
      })),
      distinctUntilChanged((a, b) => a.genre === b.genre && a.slug === b.slug),
    ),
    { initialValue: { genre: '', slug: '' } },
  );

  /** `undefined` = loading; `null` = not found; otherwise the review. */
  protected readonly review = toSignal<Review | null | undefined>(
    this.route.paramMap.pipe(
      switchMap((p) => {
        const slug = p.get('slug');
        if (!slug) return of<Review | null>(null);
        return this.reviewService.getBySlug(slug).pipe(catchError(() => of<Review | null>(null)));
      }),
    ),
    { initialValue: undefined },
  );

  /** True when the URL's genre matches the loaded review's genre. */
  protected readonly genreMatches = computed(() => {
    const r = this.review();
    const p = this.params();
    return r != null && r.genre === p.genre;
  });

  protected readonly coverUrl = computed(() => this.strapi.mediaUrl(this.review()?.cover ?? null));

  protected readonly genreLabel = computed(() => {
    const r = this.review();
    return r ? GENRE_LABELS[r.genre] : '';
  });

  protected readonly genreLabelSingular = computed(() => {
    const r = this.review();
    return r ? GENRE_LABELS_SINGULAR[r.genre] : '';
  });

  /** Star rating string ★★★☆☆ — or null when the review has no rating. */
  protected readonly stars = computed(() => {
    const value = this.review()?.rating;
    if (value == null) return null;
    const clamped = Math.max(0, Math.min(5, Math.round(value)));
    return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
  });

  /** True when the subject info box should be shown at all. */
  protected readonly hasSubjectInfo = computed(() => {
    const r = this.review();
    return !!r && (!!r.subjectTitle || !!r.subjectCreator || !!r.subjectYear);
  });

  /** Incremented after a successful comment submission to refetch the list. */
  protected readonly commentRefreshKey = signal(0);

  protected onCommentSubmitted(): void {
    this.commentRefreshKey.update((n) => n + 1);
  }

  constructor() {
    // Reactive SEO: title + description + Open Graph re-render whenever the
    // loaded review changes. Using the SeoService keeps Title/Meta updates
    // SSR-safe and consistent with other pages.
    effect(() => {
      const r = this.review();
      if (!r) return;
      this.seo.update({
        title: r.title,
        description: r.excerpt ?? `Review zu ${r.subjectTitle ?? r.title}.`,
        image: this.coverUrl() ?? undefined,
        type: 'article',
      });
    });
  }
}
