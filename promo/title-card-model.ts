// Title card model: the text, the timeline and the stage size for the developer-only promo page.
// Pure: no DOM, no clock, no randomness, no import from the game.

export type CardId = 'start' | 'end' | 'share';
export type CardLineRole = 'title' | 'subtitle' | 'tagline' | 'credit' | 'address';

export interface CardLine {
  /** Picks the CSS class: title-card__line--<role>. */
  readonly role: CardLineRole;
  readonly text: string;
}

export interface TitleCardModel {
  readonly card: CardId;
  readonly lines: readonly CardLine[];
}

export const STAGE = { widthPx: 1920, heightPx: 1080 } as const;

/** The share card is a link-preview picture, not a video frame (requirement 12.2). */
export const SHARE_STAGE = { widthPx: 1200, heightPx: 630 } as const;

/** Id the page looks up in MONSTERS. */
export const CARD_MONSTER_ID = 'plaque-puff';

export type StepId = 'mirror' | 'lights' | 'monster' | 'text';
export interface Step {
  readonly id: StepId;
  readonly startMs: number;
  readonly durationMs: number;
}

/** Four fades, in order, with no gap and no overlap. 4000 ms in all. */
export const TIMELINE: readonly Step[] = Object.freeze([
  Object.freeze({ id: 'mirror', startMs: 0, durationMs: 1000 }),
  Object.freeze({ id: 'lights', startMs: 1000, durationMs: 1000 }),
  Object.freeze({ id: 'monster', startMs: 2000, durationMs: 1000 }),
  Object.freeze({ id: 'text', startMs: 3000, durationMs: 1000 }),
] as const satisfies readonly Step[]);

function line(role: CardLineRole, text: string): CardLine {
  return Object.freeze({ role, text });
}

const START_CARD: TitleCardModel = Object.freeze({
  card: 'start',
  lines: Object.freeze([line('title', 'FOAMTOM'), line('subtitle', 'The Haunted Mirror')]),
});

const END_CARD: TitleCardModel = Object.freeze({
  card: 'end',
  lines: Object.freeze([
    line('title', 'FOAMTOM'),
    line('tagline', "Free \u00B7 in your phone's browser"),
    line('credit', 'Built with Kiro'),
    line('address', 'github.com/yateen01-oralsurgeonn/Foamtom'),
  ]),
});

// Requirement 12.3: the name and the approved subtitle (Dr. Yatin, 28 Nov 2026).
const SHARE_CARD: TitleCardModel = Object.freeze({
  card: 'share',
  lines: Object.freeze([line('title', 'Foamtom'), line('subtitle', 'The 2-minute toothbrushing game')]),
});

/** The end card only for the exact string 'end', the share card only for 'share'. Everything else is the start card. */
export function titleCardModel(card: string | null | undefined): TitleCardModel {
  if (card === 'end') return END_CARD;
  if (card === 'share') return SHARE_CARD;
  return START_CARD;
}

/** True only for the exact string '1'. */
export function isStill(value: string | null | undefined): boolean {
  return value === '1';
}
