// Which corner of the mirror frame glows. Pure: no DOM, no clock, no randomness.
// Looks only: nothing here changes a game rule.
import type { View } from '../logic/view';
import type { ZoneId } from '../logic/types';
import { REGION_LOOKS } from './effects';
import type { RegionLevel, RegionLook } from './effects';

export type { RegionLevel, RegionLook } from './effects';

export type FrameRegion = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** The only zone-to-region table. The side is chosen through this table and nowhere else. */
export const ZONE_REGION: Record<ZoneId, FrameRegion> = {
  'upper-left': 'top-left',
  'upper-right': 'top-right',
  'lower-left': 'bottom-left',
  'lower-right': 'bottom-right',
};

export const REGION_ORDER: readonly FrameRegion[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

export interface RegionState {
  readonly region: FrameRegion;
  readonly level: RegionLevel;
  readonly look: RegionLook;
}

export interface FrameGuidance {
  /** Always four, in REGION_ORDER. */
  readonly regions: readonly RegionState[];
  readonly activeRegion: FrameRegion | null;
  /** False when paused or when no session is running. */
  readonly flickering: boolean;
}

/** Only the phase and the zone may matter. `null` means no session is running. */
export type GuidanceInput = Pick<View, 'phase' | 'zoneId'> | null;

function regionState(region: FrameRegion, level: RegionLevel): RegionState {
  return { region, level, look: REGION_LOOKS[level] };
}

export function frameGuidance(input: GuidanceInput): FrameGuidance {
  if (input === null || input.phase === 'ended') {
    return {
      regions: REGION_ORDER.map((r) => regionState(r, 'off')),
      activeRegion: null,
      flickering: false,
    };
  }
  const active = ZONE_REGION[input.zoneId];
  return {
    regions: REGION_ORDER.map((r) => regionState(r, r === active ? 'active' : 'dim')),
    activeRegion: active,
    flickering: input.phase === 'running',
  };
}
