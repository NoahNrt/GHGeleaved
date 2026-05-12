import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';

import { ReviewService } from '../../services/review.service';
import { ReviewCard } from '../../shared/review-card/review-card';
import { ALL_GENRES, GENRE_LABELS } from '../../models/review.model';
import type { Genre, Review } from '../../models/review.model';
import { NotFound } from '../not-found/not-found';

/**
 * One page per top-level genre, reached via `/buch`, `/film`, `/musik`, `/spiel`.
 * The `:genre` route param is validated against the known enum; anything else
 * renders the 404 component inline (the URL stays put — feels nicer than a
 * blanket redirect when a user types a typo).
 */
@Component({
  selector: 'app-genre-list',
  imports: [ReviewCard, NotFound],
  templateUrl: './genre-list.html',
  styleUrl: './genre-list.css',
})
export class GenreList {
  private readonly route = inject(ActivatedRoute);
  private readonly reviewService = inject(ReviewService);

  protected readonly validGenre = toSignal(
    this.route.paramMap.pipe(
      map((p) => {
        const raw = p.get('genre');
        return (ALL_GENRES as string[]).includes(raw ?? '') ? (raw as Genre) : null;
      }),
    ),
    { initialValue: null },
  );

  protected readonly heading = computed(() => {
    const g = this.validGenre();
    return g ? GENRE_LABELS[g] : null;
  });

  /** Re-fetches whenever the genre param changes. `undefined` = loading. */
  protected readonly reviews = toSignal<Review[] | undefined>(
    this.route.paramMap.pipe(
      switchMap((p) => {
        const raw = p.get('genre');
        if (!raw || !(ALL_GENRES as string[]).includes(raw)) {
          return of<Review[]>([]);
        }
        return this.reviewService.getByGenre(raw as Genre).pipe(catchError(() => of<Review[]>([])));
      }),
    ),
    { initialValue: undefined },
  );
}
