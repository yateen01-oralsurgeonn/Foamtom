// Zone fact: where brushing was seen least (parent-screen design 5.4, requirements 5 and 6).
// Pure: no DOM, no clock, no randomness, no storage. Display-only text from PARENT_TEXT.
import type { SessionResult, ZoneId } from '../logic/types';
import type { ParentViewConstants } from './parent-constants';
import { JOIN, PARENT_TEXT, ZONE_NAMES, fill } from './parent-text';

export type ZoneFactKind = 'least' | 'every' | 'not-enough';

export interface ZoneFact {
  readonly kind: ZoneFactKind;
  /** Empty unless `kind` is 'least'. In ZONE_ORDER order. */
  readonly zones: readonly ZoneId[];
  /** Row 10, 10b, 11 or 12. */
  readonly text: string;
}

function notEnough(): ZoneFact {
  return { kind: 'not-enough', zones: [], text: PARENT_TEXT['zone-not-enough'].text };
}

/** "a", "a and b", "a, b and c": no comma before "and" (requirement 5.3). */
function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return names.slice(0, -1).join(JOIN.separator) + JOIN.last + names[names.length - 1];
}

/**
 * The zone fact over the camera-mode sessions of the window. Only verified zone results count.
 * The measure is the average of the unseen seconds, max(0, ZONE_DURATION - brushed - untracked).
 * Averages are compared by cross-multiplying whole numbers, so rounding never decides a tie.
 */
export function zoneFact(
  windowCameraSessions: readonly SessionResult[],
  constants: ParentViewConstants,
): ZoneFact {
  const camera = windowCameraSessions.filter((s) => s.mode === 'camera');
  if (camera.length < constants.ZONE_FACT_MIN_CAMERA_SESSIONS) return notEnough();

  const order = constants.ZONE_ORDER;
  const sum = order.map(() => 0);
  const count = order.map(() => 0);
  for (const session of camera) {
    for (const zr of session.zoneResults) {
      if (!zr.verified) continue;
      const i = order.indexOf(zr.zoneId);
      if (i < 0) continue;
      sum[i] += Math.max(0, constants.ZONE_DURATION - zr.secondsBrushed - zr.secondsUntracked);
      count[i] += 1;
    }
  }

  // Highest average among zones that have at least one verified result.
  let best = -1;
  for (let i = 0; i < order.length; i++) {
    if (count[i] === 0) continue;
    if (best < 0 || sum[i] * count[best] > sum[best] * count[i]) best = i;
  }
  if (best < 0) return notEnough();
  if (sum[best] === 0) {
    return { kind: 'every', zones: [], text: PARENT_TEXT['zone-every'].text };
  }

  const zones: ZoneId[] = [];
  for (let i = 0; i < order.length; i++) {
    if (count[i] > 0 && sum[i] * count[best] === sum[best] * count[i]) zones.push(order[i]);
  }
  const text =
    zones.length === 1
      ? fill(PARENT_TEXT['zone-least-one'].text, { zone: ZONE_NAMES[zones[0]] })
      : fill(PARENT_TEXT['zone-least-many'].text, { zones: joinNames(zones.map((z) => ZONE_NAMES[z])) });
  return { kind: 'least', zones, text };
}
