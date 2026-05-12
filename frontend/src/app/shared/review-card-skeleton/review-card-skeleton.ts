import { Component, input } from '@angular/core';

/**
 * Lightweight placeholder that mimics the shape of `ReviewCard` while data
 * is loading. Renders `count` copies in a grid (default 6) so the layout
 * doesn't jump once real cards arrive.
 *
 * Tailwind's `animate-pulse` provides the shimmer; no JS needed.
 */
@Component({
  selector: 'app-review-card-skeleton',
  imports: [],
  templateUrl: './review-card-skeleton.html',
  styleUrl: './review-card-skeleton.css',
})
export class ReviewCardSkeleton {
  readonly count = input<number>(6);

  protected readonly placeholders = Array.from({ length: 12 }, (_, i) => i);

  protected visiblePlaceholders(): number[] {
    return this.placeholders.slice(0, Math.max(1, this.count()));
  }
}
