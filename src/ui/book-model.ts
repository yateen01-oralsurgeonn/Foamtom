// The Monster Book as data (design section 5.7). Pure: no DOM, no clock, no randomness.
// The `invite` flag, `showRareInvitation` and the `say-line` action are added later (task 34).

import { computeMonsterBook } from '../logic/monster-book';
import { MONSTERS } from '../logic/monsters';
import type { SessionResult } from '../logic/types';

export interface BookEntry {
  readonly id: string;
  readonly rare: boolean;
  readonly owned: boolean;
  /** The monster's name, or null when not owned (req 7.5). */
  readonly name: string | null;
}

export interface BookView {
  readonly entries: readonly BookEntry[];
}

export type BookTapAction =
  | { readonly kind: 'say-name'; readonly text: string }
  | { readonly kind: 'none' };

/** Always twelve entries in table order. Reads only `monstersEarned` of each session. */
export function monsterBookView(sessions: readonly SessionResult[]): BookView {
  const owned = computeMonsterBook(sessions).unlockedIds;
  const entries = MONSTERS.map((m): BookEntry => {
    const isOwned = owned.has(m.id);
    return {
      id: m.id,
      rare: m.rarity === 'rare',
      owned: isOwned,
      name: isOwned ? m.name : null,
    };
  });
  return { entries };
}

/** A failing read gives twelve silhouettes and never throws (req 7.6). */
export function bookViewFromLoader(load: () => readonly SessionResult[]): BookView {
  try {
    return monsterBookView(load());
  } catch {
    return monsterBookView([]);
  }
}

export function bookTapAction(entry: BookEntry): BookTapAction {
  if (entry.owned && entry.name !== null) return { kind: 'say-name', text: entry.name };
  return { kind: 'none' };
}
