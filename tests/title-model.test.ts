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

  describe('with a parent handler', () => {
    const withParent = titleControls(true);

    it('adds a quiet parent control with an icon and a text id', () => {
      const quiet = withParent.filter((c) => c.size === 'quiet');
      expect(quiet).toHaveLength(1);
      expect(quiet[0].id).toBe('parent');
      expect(quiet[0].target).toBe('parent');
      expect(quiet[0].textId).toBe('grown-ups');
      expect(quiet[0].icon).toBe(true);
      expect(withParent).toHaveLength(3);
    });

    it('is present only with a handler', () => {
      expect(titleControls().some((c) => c.id === 'parent')).toBe(false);
      expect(titleControls(false).some((c) => c.id === 'parent')).toBe(false);
      expect(titleControls(false)).toEqual(controls);
    });

    it('still has exactly one large control', () => {
      expect(withParent.filter((c) => c.size === 'large')).toHaveLength(1);
    });

    it('no control mentions sound, mute or volume', () => {
      for (const c of withParent) {
        expect(`${c.id} ${c.target} ${c.textId}`).not.toMatch(/sound|mute|volume/i);
      }
    });
  });
});
