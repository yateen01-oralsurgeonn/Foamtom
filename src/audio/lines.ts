// Every voice line, with its caption, in one table (req 4.5, 4.3).
// Line ids for zones, smoke and end match the `captionLineId` values of `toView`
// (src/logic/view.ts). 'start' is owned by the start screen.

export interface VoiceLine {
  readonly id: string;
  /** What is spoken. */
  readonly text: string;
  /** What is shown. Never empty. */
  readonly caption: string;
}

export const LINES: readonly VoiceLine[] = [
  { id: 'start', text: 'Tap to brush for two minutes!', caption: 'Tap to brush for two minutes!' },
  {
    id: 'zone-upper-right',
    text: 'A ghoul is hiding upper right!',
    caption: 'A ghoul is hiding upper right!',
  },
  {
    id: 'zone-upper-left',
    text: 'A ghoul is hiding upper left!',
    caption: 'A ghoul is hiding upper left!',
  },
  {
    id: 'zone-lower-left',
    text: 'A ghoul is hiding lower left!',
    caption: 'A ghoul is hiding lower left!',
  },
  {
    id: 'zone-lower-right',
    text: 'A ghoul is hiding lower right!',
    caption: 'A ghoul is hiding lower right!',
  },
  {
    id: 'smoke',
    text: 'Keep brushing! Brush the smoke away!',
    caption: 'Keep brushing! Brush the smoke away!',
  },
  { id: 'end', text: 'Well done! Two minutes of brushing!', caption: 'Well done! Two minutes of brushing!' },
  { id: 'end-close', text: 'Two minutes. Every corner.', caption: 'Two minutes. Every corner.' },
  { id: 'rare-invite', text: 'Brush morning AND night.', caption: 'Brush morning AND night.' },
  // Shown and spoken once on the start screen while the camera is starting (core req 8.7).
  { id: 'waiting', text: 'Getting the mirror ready...', caption: 'Getting the mirror ready...' },
];

/** Finds a line by id; undefined if there is none. */
export function getLine(id: string): VoiceLine | undefined {
  return LINES.find((line) => line.id === id);
}
