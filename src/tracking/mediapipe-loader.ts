// Browser only. Creates the MediaPipe hand tracker and face tracker from files on this
// site's own origin (design 8.1, req 6.2, 10.1). Nothing is fetched from another website.
// File names follow docs/review/MEDIAPIPE-DOC-CHECK.md.
import { FaceDetector, FaceLandmarker, FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { DetectorResultLike, HandResultLike, MeshResultLike } from './landmark-adapters';
import { FACE_MODEL } from './thresholds';

/** Folder of the model files, below the site's base path. */
const MODELS_DIR = 'models/';
/** Folder of the WASM runtime, below the model folder. */
const WASM_DIR = 'models/wasm';
const HAND_MODEL_FILE = 'hand_landmarker.task';
const DETECTOR_MODEL_FILE = 'blaze_face_short_range.tflite';
const MESH_MODEL_FILE = 'face_landmarker.task';

/** Most hands the hand tracker looks for. */
const MAX_HANDS = 2;
/** Most faces the face mesh looks for. */
const MAX_FACES = 1;

type Delegate = 'GPU' | 'CPU';
type FaceModelKind = 'detector' | 'mesh';

/** One tracker: gives a result for one video frame. `timestampMs` must go up from call to call. */
export interface HandTracker {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): HandResultLike;
}
export interface DetectorTracker {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): DetectorResultLike;
}
export interface MeshTracker {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): MeshResultLike;
}

interface TrackersBase {
  readonly hand: HandTracker;
  /** Releases both trackers. Safe to call more than once. */
  close(): void;
}

/** The two trackers. `faceModel` says which face tracker `face` is. */
export type Trackers =
  | (TrackersBase & { readonly faceModel: 'detector'; readonly face: DetectorTracker })
  | (TrackersBase & { readonly faceModel: 'mesh'; readonly face: MeshTracker });

function basePath(): string {
  return import.meta.env.BASE_URL;
}

async function create(faceModel: FaceModelKind, delegate: Delegate): Promise<Trackers> {
  const base = basePath();
  const fileset = await FilesetResolver.forVisionTasks(`${base}${WASM_DIR}`);
  const options = (file: string) => ({
    baseOptions: { modelAssetPath: `${base}${MODELS_DIR}${file}`, delegate },
    runningMode: 'VIDEO' as const,
  });

  const hand = await HandLandmarker.createFromOptions(fileset, {
    ...options(HAND_MODEL_FILE),
    numHands: MAX_HANDS,
  });

  let closed = false;
  try {
    if (faceModel === 'mesh') {
      const face = await FaceLandmarker.createFromOptions(fileset, {
        ...options(MESH_MODEL_FILE),
        numFaces: MAX_FACES,
      });
      return {
        faceModel: 'mesh',
        hand,
        face,
        close() {
          if (closed) return;
          closed = true;
          hand.close();
          face.close();
        },
      };
    }
    const face = await FaceDetector.createFromOptions(fileset, options(DETECTOR_MODEL_FILE));
    return {
      faceModel: 'detector',
      hand,
      face,
      close() {
        if (closed) return;
        closed = true;
        hand.close();
        face.close();
      },
    };
  } catch (error) {
    hand.close();
    throw error;
  }
}

/**
 * Creates the trackers from this site's own files. Asks for the GPU delegate first and, if that
 * fails, creates them again with the CPU delegate. Rejects if both fail. The caller closes the
 * result with `close()`.
 */
export async function loadTrackers(faceModel: FaceModelKind = FACE_MODEL): Promise<Trackers> {
  try {
    return await create(faceModel, 'GPU');
  } catch {
    return await create(faceModel, 'CPU');
  }
}
