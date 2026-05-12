import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { GENRE_LABELS } from '../../models/review.model';
import type { Review } from '../../models/review.model';
import { StrapiService } from '../../services/strapi.service';

/**
 * Compact preview card used in genre lists and on the home page.
 * The whole card is wrapped in a router link that points to the detail
 * page `/<genre>/<slug>` — that route is wired up in Phase 3, so clicking
 * the card will still resolve to the 404 page until then.
 */
@Component({
  selector: 'app-review-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './review-card.html',
  styleUrl: './review-card.css',
})
export class ReviewCard {
  private readonly strapi = inject(StrapiService);

  readonly review = input.required<Review>();

  protected readonly coverUrl = computed(() => this.strapi.coverUrlFor(this.review()));

  protected readonly genreLabel = computed(() => GENRE_LABELS[this.review().genre]);

  /** Render an integer rating 1–5 as a star string (★★★☆☆). */
  protected readonly stars = computed(() => {
    const value = this.review().rating;
    if (value == null) return null;
    const clamped = Math.max(0, Math.min(5, Math.round(value)));
    return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
  });
}
