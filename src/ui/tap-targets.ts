// Minimum size, in px, of every tappable thing on the new screens (design section 5.5).
// Pure: no DOM, no clock. The painters apply each pair with `style.minWidth` and
// `style.minHeight`. The `parent` row is added later (task 37).

export type TapTargetId =
  | 'start'
  | 'titleBook'
  | 'parent'
  | 'bookCell'
  | 'bookBack'
  | 'endDone'
  | 'endBook';

export interface TapTarget {
  readonly minWidthPx: number;
  readonly minHeightPx: number;
}

export const TAP_TARGETS: Readonly<Record<Exclude<TapTargetId, 'parent'>, TapTarget>> = {
  start: { minWidthPx: 160, minHeightPx: 72 },
  titleBook: { minWidthPx: 128, minHeightPx: 52 },
  bookCell: { minWidthPx: 72, minHeightPx: 72 },
  bookBack: { minWidthPx: 96, minHeightPx: 48 },
  endDone: { minWidthPx: 160, minHeightPx: 72 },
  endBook: { minWidthPx: 128, minHeightPx: 56 },
};
