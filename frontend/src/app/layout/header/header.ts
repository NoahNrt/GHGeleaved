import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ALL_GENRES, GENRE_LABELS } from '../../models/review.model';

/**
 * Top-of-page site header. Renders the brand mark on the left and the four
 * genre sections + home on the right. `RouterLinkActive` adds the accent
 * underline to the active route.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  protected readonly genres = ALL_GENRES.map((g) => ({
    value: g,
    label: GENRE_LABELS[g],
  }));
}
