import { Component, inject, input, output, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CommentService } from '../../services/comment.service';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Anonymous comment form: name (required), email (optional), body (required).
 *
 * The Strapi backend always stores new comments as `approved=false`, so the
 * UI tells the user up-front that their comment will appear after review.
 * Emits `submitted` after a successful POST so the parent can bump a
 * refresh key on the comment list (in case the admin approves quickly).
 */
@Component({
  selector: 'app-comment-form',
  imports: [ReactiveFormsModule],
  templateUrl: './comment-form.html',
  styleUrl: './comment-form.css',
})
export class CommentForm {
  private readonly fb = inject(FormBuilder);
  private readonly commentService = inject(CommentService);

  readonly reviewId = input.required<number>();
  readonly submitted = output<void>();

  protected readonly status = signal<SubmitStatus>('idle');
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form: FormGroup = this.fb.group({
    authorName: ['', [Validators.required, Validators.maxLength(80)]],
    authorEmail: ['', [Validators.email]],
    body: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  protected get nameCtrl() {
    return this.form.controls['authorName'];
  }
  protected get emailCtrl() {
    return this.form.controls['authorEmail'];
  }
  protected get bodyCtrl() {
    return this.form.controls['body'];
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    this.status.set('submitting');
    this.errorMessage.set(null);

    this.commentService
      .create({
        authorName: raw.authorName!.trim(),
        authorEmail: raw.authorEmail ? raw.authorEmail.trim() : undefined,
        body: raw.body!.trim(),
        review: this.reviewId(),
      })
      .subscribe({
        next: () => {
          this.status.set('success');
          this.form.reset({ authorName: '', authorEmail: '', body: '' });
          this.submitted.emit();
        },
        error: (err) => {
          this.status.set('error');
          this.errorMessage.set(
            err?.error?.error?.message ??
              'Senden fehlgeschlagen. Bitte später erneut versuchen.',
          );
        },
      });
  }

  protected dismissStatus(): void {
    this.status.set('idle');
    this.errorMessage.set(null);
  }
}
