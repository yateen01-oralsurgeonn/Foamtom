// The Monster Book as data (design section 5.7). Pure: no DOM, no clock, no randomness.

import { computeMonsterBook } from '../logic/monster-book';
import { MONSTERS } from '../logic/monsters';
import type { SessionResult } from '../logic/types';

export interface BookEntry {
  readonly id: string;
  readonly rare: boolean;
  readonly owned: boolean;
  /** The monster's name, or null when not owned (req 7.5). */
  readonly name: string | null;
  /** Rare and not owned (req 8.1). */
  readonly invite: boolean;
}

export interface BookView {
  readonly entries: readonly BookEntry[];
  /** True exactly when some entry has `invite` (req 8). */
  readonly showRareInvitation: boolean;
}

export type BookTapAction =
  | { readonly kind: 'say-name'; readonly text: string }
  | { readonly kind: 'say-line'; readonly lineId: 'rare-invite' }
  | { readonly kind: 'none' };

/** Always twelve entries in table order. Reads only `monstersEarned` of each session. */
export function monsterBookView(sessions: readonly SessionResult[]): BookView {
  const owned = computeMonsterBook(sessions).unlockedIds;
  const entries = MONSTERS.map((m): BookEntry => {
    const isOwned = owned.has(m.id);
    const rare = m.rarity === 'rare';
    return {
      id: m.id,
      rare,
      owned: isOwned,
      name: isOwned ? m.name : null,
      invite: rare && !isOwned,
    };
  });
  return { entries, showRareInvitation: entries.some((e) => e.invite) };
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
  if (entry.invite) return { kind: 'say-line', lineId: 'rare-invite' };
  return { kind: 'none' };
}
