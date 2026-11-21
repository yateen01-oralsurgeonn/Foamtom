import { describe, expect, it } from 'vitest';
import { DISPLAY_TEXT } from '../src/ui/display-text';
import { titleControls } from '../src/ui/title-model';

describe('titleModel', () => {
  const controls = titleControls();

  it('has exactly one large control and it is start', () => {
    const large = controls.filter((c) => c.size === 'large');
    expect(large).toHaveLength(1);
    expect(large[0].id).toBe('start');
  });

  it('has one small control, book', () => {
    const small = controls.filter((c) => c.size === 'small');
    expect(small).toHaveLength(1);
    expect(small[0].id).toBe('book');
    expect(controls).toHaveLength(2);
  });

  it('every control has an icon and a text id', () => {
    for (const c of controls) {
      expect(c.icon).toBe(true);
      expect(c.textId.length).toBeGreaterThan(0);
    }
  });

  it('no control id or text id mentions sound, mute or volume', () => {
    for (const c of controls) {
      expect(`${c.id} ${c.target} ${c.textId}`).not.toMatch(/sound|mute|volume/i);
    }
  });

  it('privacy is a DISPLAY_TEXT entry of kind shown', () => {
    expect(DISPLAY_TEXT.privacy.kind).toBe('shown');
  });
});
