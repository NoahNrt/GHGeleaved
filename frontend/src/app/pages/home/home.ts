import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { ReviewService } from '../../services/review.service';
import { ReviewCard } from '../../shared/review-card/review-card';

/**
 * Landing page — shows the most recent reviews across all genres.
 *
 * Data flow:
 *   - `ReviewService.getLatest()` fires an HTTP request on construction.
 *   - On the server, Angular's hydration system waits for that request to
 *     resolve before serializing the HTML.
 *   - `withHttpTransferCacheOptions` then replays the cached response on
 *     the client so we don't double-fetch.
 */
@Component({
  selector: 'app-home',
  imports: [ReviewCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly reviewService = inject(ReviewService);

  /** `undefined` until the first response lands; lets us distinguish loading vs. empty. */
  protected readonly latest = toSignal(
    this.reviewService.getLatest(12).pipe(catchError(() => of([]))),
    { initialValue: undefined },
  );
}
