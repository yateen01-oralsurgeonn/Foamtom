import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  classifyFrame,
  pickLargestFace,
  selectHandPoint,
} from '../src/tracking/classify-frame';
import {
  LEVEL_DEAD_ZONE,
  NEAR_MOUTH_FACE_WIDTHS,
  SIDE_DEAD_ZONE,
} from '../src/tracking/thresholds';
import type { FaceInput, FrameInput, FrameResult, HandInput, Point } from '../src/tracking/types';
import {
  emptyFrame,
  faceNoHand,
  handAbove,
  handBelow,
  handFarAway,
  handNoFace,
  handRawLeftCheek,
  handRawRightCheek,
  secondFace,
  twoHandsNear,
} from './fixtures/tracking/frames';

// ---------- test helpers ----------

/** A hand whose 21 landmarks all sit at one point. */
function handAtPoint(x: number, y: number): HandInput {
  return { landmarks: Array.from({ length: 21 }, () => ({ x, y })) };
}

interface FaceSpec {
  readonly mx: number; // mouth, image x (0 to 1 of width)
  readonly my: number; // mouth, image y
  readonly width: number; // face width in the one unit (x times aspect)
  readonly tilt: number; // radians, angle of the face axis
}

interface FrameSpec extends FaceSpec {
  readonly aspect: number;
  readonly hands: readonly { readonly rx: number; readonly ry: number }[]; // in face widths, on the face axes
}

function faceFromSpec(spec: FaceSpec, aspect: number): FaceInput {
  const ux = Math.cos(spec.tilt);
  const uy = Math.sin(spec.tilt);
  const mx = spec.mx * aspect;
  const half = spec.width / 2;
  const toImage = (x: number, y: number): Point => ({ x: x / aspect, y });
  return {
    mouth: { x: spec.mx, y: spec.my },
    edgeA: toImage(mx - ux * half, spec.my - uy * half),
    edgeB: toImage(mx + ux * half, spec.my + uy * half),
  };
}

function frameFromSpec(spec: FrameSpec): FrameInput {
  const ux = Math.cos(spec.tilt);
  const uy = Math.sin(spec.tilt);
  const vx = -uy;
  const vy = ux;
  const mx = spec.mx * spec.aspect;
  const hands = spec.hands.map(({ rx, ry }) => {
    const x = mx + (ux * rx + vx * ry) * spec.width;
    const y = spec.my + (uy * rx + vy * ry) * spec.width;
    return handAtPoint(x / spec.aspect, y);
  });
  return { aspect: spec.aspect, faces: [faceFromSpec(spec, spec.aspect)], hands };
}

// Face tilt is kept under 90 degrees: past that the face is upside down and the
// edge with the smaller x is a different edge, which flips raw left and right.
const MAX_TILT = 1.3;

const handOffsetArb = fc.record({
  rx: fc.double({ min: -1.5, max: 1.5, noNaN: true }),
  ry: fc.double({ min: -1.5, max: 1.5, noNaN: true }),
});

const faceSpecArb = fc.record({
  mx: fc.double({ min: 0.2, max: 0.8, noNaN: true }),
  my: fc.double({ min: 0.2, max: 0.8, noNaN: true }),
  width: fc.double({ min: 0.05, max: 0.6, noNaN: true }),
  tilt: fc.double({ min: -MAX_TILT, max: MAX_TILT, noNaN: true }),
});

const frameArb: fc.Arbitrary<FrameSpec> = fc.record({
  mx: fc.double({ min: 0.2, max: 0.8, noNaN: true }),
  my: fc.double({ min: 0.2, max: 0.8, noNaN: true }),
  width: fc.double({ min: 0.05, max: 0.6, noNaN: true }),
  tilt: fc.double({ min: -MAX_TILT, max: MAX_TILT, noNaN: true }),
  aspect: fc.double({ min: 0.5, max: 2.5, noNaN: true }),
  hands: fc.array(handOffsetArb, { minLength: 0, maxLength: 2 }),
});

function mirrorPoint(p: Point): Point {
  return { x: 1 - p.x, y: p.y };
}

function mirrorFrame(input: FrameInput): FrameInput {
  return {
    aspect: input.aspect,
    faces: input.faces.map((f) => ({
      mouth: mirrorPoint(f.mouth),
      edgeA: mirrorPoint(f.edgeA),
      edgeB: mirrorPoint(f.edgeB),
    })),
    hands: input.hands.map((h) => ({ landmarks: h.landmarks.map(mirrorPoint) })),
  };
}

/** Axis-aligned face of width 1 centred on the origin; the hand wrist is at (x, y) in face widths. */
function exactFrame(x: number, y: number): FrameInput {
  return {
    aspect: 1,
    faces: [{ mouth: { x: 0, y: 0 }, edgeA: { x: -0.5, y: 0 }, edgeB: { x: 0.5, y: 0 } }],
    hands: [handAtPoint(x, y)],
  };
}

function expectSameResult(actual: FrameResult, expected: FrameResult): void {
  expect(actual.faceSeen).toBe(expected.faceSeen);
  expect(actual.handNearMouth).toBe(expected.handNearMouth);
  expect(actual.side).toBe(expected.side);
  expect(actual.level).toBe(expected.level);
  if (expected.handRel === null) {
    expect(actual.handRel).toBeNull();
  } else {
    expect(actual.handRel).not.toBeNull();
    expect(Math.abs(actual.handRel!.x - expected.handRel.x)).toBeLessThan(1e-9);
    expect(Math.abs(actual.handRel!.y - expected.handRel.y)).toBeLessThan(1e-9);
  }
}

// ---------- fixtures ----------

describe('classifyFrameFixtures', () => {
  it('a hand on the raw right below the mouth reads left and lower', () => {
    const r = classifyFrame(handRawRightCheek);
    expect(r).toMatchObject({ faceSeen: true, handNearMouth: true, side: 'left', level: 'lower' });
    expect(r.handRel!.x).toBeCloseTo(0.5, 9);
    expect(r.handRel!.y).toBeCloseTo(0.25, 9);
  });

  it('a hand on the raw left below the mouth reads right and lower', () => {
    expect(classifyFrame(handRawLeftCheek)).toMatchObject({
      faceSeen: true,
      handNearMouth: true,
      side: 'right',
      level: 'lower',
    });
  });

  it('a hand above the mouth reads upper, and side is unknown on the centre line', () => {
    expect(classifyFrame(handAbove)).toMatchObject({
      handNearMouth: true,
      side: 'unknown',
      level: 'upper',
    });
  });

  it('a hand below the mouth reads lower, and side is unknown on the centre line', () => {
    expect(classifyFrame(handBelow)).toMatchObject({
      handNearMouth: true,
      side: 'unknown',
      level: 'lower',
    });
  });

  it('a hand far away is not near the mouth', () => {
    expect(classifyFrame(handFarAway)).toEqual({
      faceSeen: true,
      handNearMouth: false,
      side: 'unknown',
      level: 'unknown',
      handRel: null,
    });
  });

  it('a face with no hand is seen, with the hand not near', () => {
    expect(classifyFrame(faceNoHand)).toEqual({
      faceSeen: true,
      handNearMouth: false,
      side: 'unknown',
      level: 'unknown',
      handRel: null,
    });
  });

  it('no face means faceSeen is false, with or without a hand', () => {
    for (const input of [handNoFace, emptyFrame]) {
      expect(classifyFrame(input)).toEqual({
        faceSeen: false,
        handNearMouth: false,
        side: 'unknown',
        level: 'unknown',
        handRel: null,
      });
    }
  });

  it('side and level are unknown whenever handNearMouth is false', () => {
    const all = [
      handRawRightCheek,
      handRawLeftCheek,
      handAbove,
      handBelow,
      handFarAway,
      faceNoHand,
      handNoFace,
      emptyFrame,
      twoHandsNear,
      secondFace,
    ];
    for (const input of all) {
      const r = classifyFrame(input);
      if (!r.handNearMouth) {
        expect(r.side).toBe('unknown');
        expect(r.level).toBe('unknown');
        expect(r.handRel).toBeNull();
      }
    }
  });

  it('a face of zero width gives faceSeen false', () => {
    const point = { x: 0.5, y: 0.5 };
    const input: FrameInput = {
      aspect: 1,
      faces: [{ mouth: point, edgeA: point, edgeB: point }],
      hands: [handAtPoint(0.5, 0.5)],
    };
    expect(classifyFrame(input).faceSeen).toBe(false);
  });
});

// ---------- properties ----------

describe('distanceIndependence', () => {
  it('scaling the face and hand arrangement by a positive factor changes nothing', () => {
    fc.assert(
      fc.property(frameArb, fc.double({ min: 0.2, max: 3, noNaN: true }), (spec, k) => {
        const base = classifyFrame(frameFromSpec(spec));
        const scaled = classifyFrame(frameFromSpec({ ...spec, width: spec.width * k }));
        expectSameResult(scaled, base);
      }),
    );
  });

  it('the shape of the image does not change the result', () => {
    fc.assert(
      fc.property(frameArb, fc.double({ min: 0.5, max: 2.5, noNaN: true }), (spec, aspect) => {
        expectSameResult(
          classifyFrame(frameFromSpec({ ...spec, aspect })),
          classifyFrame(frameFromSpec(spec)),
        );
      }),
    );
  });
});

describe('mirrorSymmetry', () => {
  it('mirroring every landmark swaps left and right and changes nothing else', () => {
    fc.assert(
      fc.property(frameArb, (spec) => {
        const input = frameFromSpec(spec);
        const r = classifyFrame(input);
        const m = classifyFrame(mirrorFrame(input));
        const swapped = r.side === 'left' ? 'right' : r.side === 'right' ? 'left' : 'unknown';
        expect(m.side).toBe(swapped);
        expect(m.faceSeen).toBe(r.faceSeen);
        expect(m.handNearMouth).toBe(r.handNearMouth);
        expect(m.level).toBe(r.level);
      }),
    );
  });
});

describe('rotationIndependence', () => {
  it('turning the whole picture about the mouth does not change the reading', () => {
    fc.assert(
      fc.property(
        frameArb,
        fc.double({ min: -MAX_TILT, max: MAX_TILT, noNaN: true }),
        (spec, otherTilt) => {
          const square = { ...spec, aspect: 1 };
          const turned = frameFromSpec({ ...square, tilt: otherTilt });
          // The turned picture is the same arrangement with another tilt of the face axis.
          expectSameResult(classifyFrame(turned), classifyFrame(frameFromSpec(square)));
        },
      ),
    );
  });

  it('rotating the landmark points themselves about the mouth gives the same reading', () => {
    fc.assert(
      fc.property(
        frameArb,
        fc.double({ min: -MAX_TILT, max: MAX_TILT, noNaN: true }),
        (spec, otherTilt) => {
          const square = { ...spec, aspect: 1 };
          const base = frameFromSpec(square);
          const angle = otherTilt - square.tilt;
          const centre = base.faces[0].mouth;
          const rotate = (p: Point): Point => {
            const dx = p.x - centre.x;
            const dy = p.y - centre.y;
            return {
              x: centre.x + dx * Math.cos(angle) - dy * Math.sin(angle),
              y: centre.y + dx * Math.sin(angle) + dy * Math.cos(angle),
            };
          };
          const rotated: FrameInput = {
            aspect: 1,
            faces: base.faces.map((f) => ({
              mouth: rotate(f.mouth),
              edgeA: rotate(f.edgeA),
              edgeB: rotate(f.edgeB),
            })),
            hands: base.hands.map((h) => ({ landmarks: h.landmarks.map(rotate) })),
          };
          expectSameResult(classifyFrame(rotated), classifyFrame(base));
        },
      ),
    );
  });
});

describe('deadZones', () => {
  const handArb = fc.record({
    rx: fc.double({ min: -0.45, max: 0.45, noNaN: true }),
    ry: fc.double({ min: -0.45, max: 0.45, noNaN: true }),
  });

  it('side and level follow the dead zones for a hand near the mouth', () => {
    fc.assert(
      fc.property(faceSpecArb, handArb, fc.double({ min: 0.5, max: 2.5, noNaN: true }), (face, hand, aspect) => {
        fc.pre(Math.abs(Math.abs(hand.rx) - SIDE_DEAD_ZONE) > 1e-9);
        fc.pre(Math.abs(Math.abs(hand.ry) - LEVEL_DEAD_ZONE) > 1e-9);
        const r = classifyFrame(frameFromSpec({ ...face, aspect, hands: [hand] }));
        expect(r.handNearMouth).toBe(true);
        const expectedSide =
          Math.abs(hand.rx) < SIDE_DEAD_ZONE ? 'unknown' : hand.rx > 0 ? 'left' : 'right';
        const expectedLevel =
          Math.abs(hand.ry) < LEVEL_DEAD_ZONE ? 'unknown' : hand.ry > 0 ? 'lower' : 'upper';
        expect(r.side).toBe(expectedSide);
        expect(r.level).toBe(expectedLevel);
      }),
    );
  });

  const nearY = NEAR_MOUTH_FACE_WIDTHS / 2;

  it('a hand exactly on the side dead-zone edge is classified, not unknown', () => {
    expect(classifyFrame(exactFrame(SIDE_DEAD_ZONE, nearY), 'wrist').side).toBe('left');
    expect(classifyFrame(exactFrame(-SIDE_DEAD_ZONE, nearY), 'wrist').side).toBe('right');
  });

  it('a hand just inside the side dead zone gives unknown', () => {
    expect(classifyFrame(exactFrame(SIDE_DEAD_ZONE * 0.99, nearY), 'wrist').side).toBe('unknown');
    expect(classifyFrame(exactFrame(-SIDE_DEAD_ZONE * 0.99, nearY), 'wrist').side).toBe('unknown');
  });

  it('a hand exactly on the level dead-zone edge is classified, not unknown', () => {
    expect(classifyFrame(exactFrame(nearY, LEVEL_DEAD_ZONE), 'wrist').level).toBe('lower');
    expect(classifyFrame(exactFrame(nearY, -LEVEL_DEAD_ZONE), 'wrist').level).toBe('upper');
  });

  it('a hand just inside the level dead zone gives unknown', () => {
    expect(classifyFrame(exactFrame(nearY, LEVEL_DEAD_ZONE * 0.99), 'wrist').level).toBe('unknown');
    expect(classifyFrame(exactFrame(nearY, -LEVEL_DEAD_ZONE * 0.99), 'wrist').level).toBe('unknown');
  });
});

describe('nearMouthExact', () => {
  it('handNearMouth is true exactly when the distance is at most the constant', () => {
    const angleArb = fc.double({ min: 0, max: 2 * Math.PI, noNaN: true });
    fc.assert(
      fc.property(
        faceSpecArb,
        fc.double({ min: 0, max: 2, noNaN: true }),
        angleArb,
        fc.double({ min: 0.5, max: 2.5, noNaN: true }),
        (face, distance, angle, aspect) => {
          fc.pre(Math.abs(distance - NEAR_MOUTH_FACE_WIDTHS) > 1e-9);
          const hand = { rx: distance * Math.cos(angle), ry: distance * Math.sin(angle) };
          const r = classifyFrame(frameFromSpec({ ...face, aspect, hands: [hand] }));
          expect(r.handNearMouth).toBe(distance <= NEAR_MOUTH_FACE_WIDTHS);
        },
      ),
    );
  });

  it('a hand exactly NEAR_MOUTH_FACE_WIDTHS away is near, and just beyond is not', () => {
    expect(classifyFrame(exactFrame(NEAR_MOUTH_FACE_WIDTHS, 0), 'wrist').handNearMouth).toBe(true);
    expect(classifyFrame(exactFrame(-NEAR_MOUTH_FACE_WIDTHS, 0), 'wrist').handNearMouth).toBe(true);
    expect(classifyFrame(exactFrame(0, NEAR_MOUTH_FACE_WIDTHS), 'wrist').handNearMouth).toBe(true);
    const beyond = NEAR_MOUTH_FACE_WIDTHS * 1.0001;
    expect(classifyFrame(exactFrame(beyond, 0), 'wrist').handNearMouth).toBe(false);
    expect(classifyFrame(exactFrame(0, beyond), 'wrist').handNearMouth).toBe(false);
  });
});

describe('secondFaceIgnored', () => {
  it('adding a smaller second face anywhere never changes the result', () => {
    fc.assert(
      fc.property(
        frameArb,
        fc.record({
          mx: fc.double({ min: -0.5, max: 1.5, noNaN: true }),
          my: fc.double({ min: -0.5, max: 1.5, noNaN: true }),
          scale: fc.double({ min: 0.05, max: 0.9, noNaN: true }),
          tilt: fc.double({ min: -MAX_TILT, max: MAX_TILT, noNaN: true }),
        }),
        fc.boolean(),
        (spec, other, listFirst) => {
          const base = frameFromSpec(spec);
          const second = faceFromSpec(
            { mx: other.mx, my: other.my, width: spec.width * other.scale, tilt: other.tilt },
            spec.aspect,
          );
          const faces = listFirst ? [second, ...base.faces] : [...base.faces, second];
          expect(classifyFrame({ ...base, faces })).toEqual(classifyFrame(base));
        },
      ),
    );
  });

  it('pickLargestFace returns the larger face, the first on a tie, and null for none', () => {
    const big = secondFace.faces[1];
    const small = secondFace.faces[0];
    expect(pickLargestFace([small, big], 1)).toBe(big);
    expect(pickLargestFace([big, small], 1)).toBe(big);
    const twin: FaceInput = { ...big };
    expect(pickLargestFace([big, twin], 1)).toBe(big);
    expect(pickLargestFace([], 1)).toBeNull();
  });

  it('the fixture with a second face reads the same as without it', () => {
    expect(classifyFrame(secondFace)).toEqual(classifyFrame(handRawRightCheek));
  });
});

describe('twoHandsRule', () => {
  const polar = (r: number, angle: number) => ({ rx: r * Math.cos(angle), ry: r * Math.sin(angle) });
  const angleArb = fc.double({ min: 0, max: 2 * Math.PI, noNaN: true });

  it('the near hand decides whatever the other hand does, in either order', () => {
    fc.assert(
      fc.property(
        faceSpecArb,
        fc.double({ min: 0, max: 0.6, noNaN: true }),
        angleArb,
        fc.double({ min: 0.8, max: 3, noNaN: true }),
        angleArb,
        fc.double({ min: 0.5, max: 2.5, noNaN: true }),
        (face, r1, a1, r2, a2, aspect) => {
          const near = polar(r1, a1);
          const far = polar(r2, a2);
          const alone = classifyFrame(frameFromSpec({ ...face, aspect, hands: [near] }));
          expect(classifyFrame(frameFromSpec({ ...face, aspect, hands: [near, far] }))).toEqual(alone);
          expect(classifyFrame(frameFromSpec({ ...face, aspect, hands: [far, near] }))).toEqual(alone);
        },
      ),
    );
  });

  it('both hands near gives side and level unknown, with handRel of the nearer hand', () => {
    fc.assert(
      fc.property(
        faceSpecArb,
        fc.double({ min: 0, max: 0.5, noNaN: true }),
        angleArb,
        fc.double({ min: 0.05, max: 0.19, noNaN: true }),
        angleArb,
        fc.boolean(),
        (face, r1, a1, extra, a2, nearerFirst) => {
          const nearer = polar(r1, a1);
          const other = polar(r1 + extra, a2);
          const hands = nearerFirst ? [nearer, other] : [other, nearer];
          const both = classifyFrame(frameFromSpec({ ...face, aspect: 1, hands }));
          const alone = classifyFrame(frameFromSpec({ ...face, aspect: 1, hands: [nearer] }));
          expect(both.handNearMouth).toBe(true);
          expect(both.side).toBe('unknown');
          expect(both.level).toBe('unknown');
          expect(both.faceSeen).toBe(true);
          expect(both.handRel).toEqual(alone.handRel);
        },
      ),
    );
  });

  it('the two-hands fixture gives unknown for side and level', () => {
    expect(classifyFrame(twoHandsNear)).toMatchObject({
      faceSeen: true,
      handNearMouth: true,
      side: 'unknown',
      level: 'unknown',
    });
  });
});

describe('handPointKinds', () => {
  // 21 hand-written points: landmark i sits at x = i / 100 and y = i / 50.
  const landmarks: Point[] = Array.from({ length: 21 }, (_, i) => ({ x: i / 100, y: i / 50 }));
  const hand: HandInput = { landmarks };
  const meanOfIndices = (indices: number[]): Point => ({
    x: indices.reduce((s, i) => s + landmarks[i].x, 0) / indices.length,
    y: indices.reduce((s, i) => s + landmarks[i].y, 0) / indices.length,
  });

  it('palm is the mean of landmarks 0, 5, 9, 13 and 17', () => {
    const p = selectHandPoint(hand, 'palm');
    const e = meanOfIndices([0, 5, 9, 13, 17]);
    expect(p.x).toBeCloseTo(e.x, 12);
    expect(p.y).toBeCloseTo(e.y, 12);
    expect(p.x).toBeCloseTo(0.088, 12);
    expect(p.y).toBeCloseTo(0.176, 12);
  });

  it('wrist is landmark 0', () => {
    expect(selectHandPoint(hand, 'wrist')).toEqual({ x: 0, y: 0 });
  });

  it('fingertips is the mean of landmarks 4, 8, 12, 16 and 20', () => {
    const p = selectHandPoint(hand, 'fingertips');
    const e = meanOfIndices([4, 8, 12, 16, 20]);
    expect(p.x).toBeCloseTo(e.x, 12);
    expect(p.y).toBeCloseTo(e.y, 12);
    expect(p.x).toBeCloseTo(0.12, 12);
    expect(p.y).toBeCloseTo(0.24, 12);
  });
});
