import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { CommentService } from '../../services/comment.service';
import type { Comment } from '../../models/review.model';

/**
 * Renders the approved comments for a single review. The list re-fetches
 * automatically when the `reviewId` input changes (e.g. navigation between
 * reviews via SPA routing). The optional `refreshKey` input lets the parent
 * trigger a manual reload after submitting a new comment — useful in case
 * the admin pre-approves it quickly.
 */
@Component({
  selector: 'app-comment-list',
  imports: [DatePipe],
  templateUrl: './comment-list.html',
  styleUrl: './comment-list.css',
})
export class CommentList {
  private readonly commentService = inject(CommentService);

  readonly reviewId = input.required<number>();
  /** Bump this counter from the parent to force a refetch. */
  readonly refreshKey = input<number>(0);

  /** `undefined` = loading, `null` = error, `Comment[]` = data. */
  protected readonly comments = toSignal<Comment[] | null | undefined>(
    toObservable(
      computed(() => ({ id: this.reviewId(), key: this.refreshKey() })),
    ).pipe(
      switchMap(({ id }) =>
        this.commentService.getForReview(id).pipe(catchError(() => of<Comment[] | null>(null))),
      ),
    ),
    { initialValue: undefined },
  );
}
