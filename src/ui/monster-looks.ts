// Monster look table: the one table of monster shapes. See design section 5.3 (req 5.1 to 5.4).
// Pure: no DOM, no clock, no randomness. Shapes only; colours live in CSS, not here.

export type BodyShape = 'round' | 'tall' | 'wide' | 'drop';
export type EarShape = 'none' | 'round' | 'points' | 'horns';
export type ExtraShape = 'none' | 'tail' | 'tuft' | 'wings' | 'bumps' | 'wisps';
/** No value is a tooth, fang, blood or drip shape (req 5.3). */
export type MouthShape = 'smile' | 'oh' | 'tongue' | 'wavy';
export type CrestShape = 'none' | 'moon' | 'sun' | 'halo' | 'crown';

export interface MonsterLook {
  readonly body: BodyShape;
  readonly ears: EarShape;
  readonly eyes: 1 | 2 | 3;
  readonly extra: ExtraShape;
  readonly mouth: MouthShape;
  /** Rare only. */
  readonly crest: CrestShape;
  /** Rare only. */
  readonly star: boolean;
}

export const MONSTER_LOOKS: Readonly<Record<string, MonsterLook>> = {
  'plaque-puff': { body: 'round', ears: 'round', eyes: 2, extra: 'none', mouth: 'smile', crest: 'none', star: false },
  'sugar-sprite': { body: 'drop', ears: 'points', eyes: 2, extra: 'wings', mouth: 'oh', crest: 'none', star: false },
  'gummy-gloop': { body: 'wide', ears: 'none', eyes: 2, extra: 'bumps', mouth: 'wavy', crest: 'none', star: false },
  fuzzlefang: { body: 'round', ears: 'points', eyes: 2, extra: 'tuft', mouth: 'tongue', crest: 'none', star: false },
  'crumb-goblin': { body: 'tall', ears: 'points', eyes: 2, extra: 'none', mouth: 'smile', crest: 'none', star: false },
  'sticky-wisp': { body: 'drop', ears: 'none', eyes: 1, extra: 'wisps', mouth: 'oh', crest: 'none', star: false },
  'molar-mumbler': { body: 'wide', ears: 'round', eyes: 3, extra: 'none', mouth: 'wavy', crest: 'none', star: false },
  'tartar-tot': { body: 'round', ears: 'horns', eyes: 1, extra: 'tail', mouth: 'smile', crest: 'none', star: false },
  'midnight-molar-ghoul': { body: 'tall', ears: 'horns', eyes: 2, extra: 'none', mouth: 'wavy', crest: 'moon', star: true },
  'dawn-drool-dragon': { body: 'wide', ears: 'horns', eyes: 2, extra: 'tail', mouth: 'tongue', crest: 'sun', star: true },
  'moonlit-mint-phantom': { body: 'drop', ears: 'none', eyes: 2, extra: 'wisps', mouth: 'smile', crest: 'halo', star: true },
  'twilight-toffee-wraith': { body: 'tall', ears: 'none', eyes: 3, extra: 'wisps', mouth: 'oh', crest: 'crown', star: true },
};

/** Joins body, ears, eyes, extra and crest. The twelve keys are pairwise different (req 5.2). */
export function shapeKey(look: MonsterLook): string {
  return [look.body, look.ears, look.eyes, look.extra, look.crest].join('|');
}
