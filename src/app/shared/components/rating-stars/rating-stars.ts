import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  template: `
    <span class="cp-rating" [attr.title]="rating() + ' / 5'">
      @for (i of fullStars(); track i) {
        <i class="bi bi-star-fill"></i>
      }
      @if (hasHalf()) {
        <i class="bi bi-star-half"></i>
      }
      @for (i of emptyStars(); track i) {
        <i class="bi bi-star"></i>
      }
      @if (showValue()) {
        <span class="ms-1 me-1 small fw-semibold text-body">{{ rating().toFixed(1) }}</span>
      }
      @if (count() !== undefined) {
        <span class="small cp-text-muted">({{ count() }})</span>
      }
    </span>
  `,
})
export class RatingStars {
  rating = input.required<number>();
  count = input<number | undefined>(undefined);
  showValue = input<boolean>(true);

  fullStars = computed(() => Array.from({ length: Math.floor(this.rating()) }));
  hasHalf = computed(() => this.rating() % 1 >= 0.5);
  emptyStars = computed(() => {
    const used = Math.floor(this.rating()) + (this.hasHalf() ? 1 : 0);
    return Array.from({ length: Math.max(0, 5 - used) });
  });
}
