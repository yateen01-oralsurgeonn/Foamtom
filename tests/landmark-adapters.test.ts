import { describe, expect, it } from 'vitest';
import {
  adaptDetectorFaces,
  adaptHands,
  adaptMeshFaces,
  type DetectorResultLike,
  type HandResultLike,
  type MeshResultLike,
} from '../src/tracking/landmark-adapters';

// Hand-written MediaPipe-shaped results. Plain numbers only.

describe('landmarkAdapters', () => {
  it('face detector: mouth is keypoint 3, the two ear points are keypoints 4 and 5', () => {
    const result: DetectorResultLike = {
      detections: [
        {
          keypoints: [
            { x: 0.4, y: 0.4 }, // 0 eye
            { x: 0.6, y: 0.4 }, // 1 eye
            { x: 0.5, y: 0.5 }, // 2 nose
            { x: 0.5, y: 0.6 }, // 3 mouth
            { x: 0.3, y: 0.45 }, // 4 ear
            { x: 0.7, y: 0.46 }, // 5 ear
          ],
        },
      ],
    };
    expect(adaptDetectorFaces(result)).toEqual([
      { mouth: { x: 0.5, y: 0.6 }, edgeA: { x: 0.3, y: 0.45 }, edgeB: { x: 0.7, y: 0.46 } },
    ]);
  });

  it('face detector: several faces keep their order; a detection with too few keypoints is dropped', () => {
    const six = (dx: number) => Array.from({ length: 6 }, (_, i) => ({ x: i / 10 + dx, y: i / 10 }));
    const result: DetectorResultLike = {
      detections: [{ keypoints: six(0) }, { keypoints: six(0).slice(0, 4) }, { keypoints: six(0.1) }],
    };
    const faces = adaptDetectorFaces(result);
    expect(faces).toHaveLength(2);
    expect(faces[0].mouth).toEqual({ x: 0.3, y: 0.3 });
    expect(faces[1].mouth.x).toBeCloseTo(0.4, 10);
  });

  it('face mesh: mouth is the midpoint of landmarks 13 and 14; the face edges are 234 and 454', () => {
    const landmarks = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }));
    landmarks[13] = { x: 0.5, y: 0.5 };
    landmarks[14] = { x: 0.5, y: 0.7 };
    landmarks[234] = { x: 0.2, y: 0.4 };
    landmarks[454] = { x: 0.8, y: 0.4 };
    const result: MeshResultLike = { faceLandmarks: [landmarks] };
    const faces = adaptMeshFaces(result);
    expect(faces).toHaveLength(1);
    expect(faces[0].mouth.x).toBeCloseTo(0.5, 10);
    expect(faces[0].mouth.y).toBeCloseTo(0.6, 10);
    expect(faces[0].edgeA).toEqual({ x: 0.2, y: 0.4 });
    expect(faces[0].edgeB).toEqual({ x: 0.8, y: 0.4 });
  });

  it('face mesh: a face with too few landmarks is dropped', () => {
    const result: MeshResultLike = { faceLandmarks: [Array.from({ length: 100 }, () => ({ x: 0, y: 0 }))] };
    expect(adaptMeshFaces(result)).toEqual([]);
  });

  it('hands: 21 landmarks per hand in order, up to two hands; a short hand is dropped', () => {
    const hand = (base: number) => Array.from({ length: 21 }, (_, i) => ({ x: base + i / 100, y: base }));
    const result: HandResultLike = { landmarks: [hand(0.1), hand(0.5).slice(0, 20), hand(0.6)] };
    const hands = adaptHands(result);
    expect(hands).toHaveLength(2);
    expect(hands[0].landmarks).toHaveLength(21);
    expect(hands[0].landmarks[4]).toEqual({ x: 0.1 + 0.04, y: 0.1 });
    expect(hands[1].landmarks[0]).toEqual({ x: 0.6, y: 0.6 });
  });

  it('adapters copy their input and do not change it', () => {
    const keypoints = Array.from({ length: 6 }, (_, i) => ({ x: i / 10, y: 0.5 }));
    const before = JSON.stringify(keypoints);
    const faces = adaptDetectorFaces({ detections: [{ keypoints }] });
    expect(JSON.stringify(keypoints)).toBe(before);
    expect(faces[0].mouth).not.toBe(keypoints[3]);
  });

  it('empty, null and missing results give empty lists', () => {
    expect(adaptDetectorFaces({ detections: [] })).toEqual([]);
    expect(adaptMeshFaces({ faceLandmarks: [] })).toEqual([]);
    expect(adaptHands({ landmarks: [] })).toEqual([]);
    expect(adaptDetectorFaces(null)).toEqual([]);
    expect(adaptMeshFaces(undefined)).toEqual([]);
    expect(adaptHands(null)).toEqual([]);
  });
});
