# MediaPipe documentation check (task 1A)

Date: 2026-11-19
Installed package: `@mediapipe/tasks-vision` version **1.2.3** (from `npm install @mediapipe/tasks-vision`).

Sources used, so a reader can repeat the check:

- The type definitions in the installed package: `node_modules/@mediapipe/tasks-vision/vision.d.ts`.
- The installed package's compiled code (`vision_bundle.mjs`), read for the WASM file names, and run once in Node to print the face-mesh connection tables (`FACE_LANDMARKS_LIPS`, `FACE_LANDMARKS_FACE_OVAL`).
- The Google AI Edge MediaPipe pages for Face Detector, Hand Landmarker and Face Landmarker (ai.google.dev/edge/mediapipe/solutions/vision/...), read on the date above.

Words only. No camera data was used.

## Item by item

### 1. Hand landmarker model

- Documentation: the file is `hand_landmarker.task` (a model bundle holding a palm detector and a hand landmark model). Download address on the documentation page: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task`.
- `design.md` 8.1: `hand_landmarker.task`. **Matches.**

### 2. Face detector model

- Documentation: the short-range BlazeFace model, file name `blaze_face_short_range.tflite`, format TFLite. Download address: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite`. A full-range model also exists (`blaze_face_full_range.tflite`); the short-range one is meant for a face close to the camera, which is the case at a bathroom sink.
- `design.md` 8.1 calls the file `face_detector.tflite`. **Differs in file name only** (see Corrections).

### 3. Face landmarker model

- Documentation: `face_landmarker.task` (a model bundle), 478 landmarks per face. Download address: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task`.
- `design.md` 8.1: `face_landmarker.task`, 478-point mesh. **Matches.**

### 4. Order of the 21 hand landmarks

- Documentation table: 0 WRIST; 1 THUMB_CMC; 2 THUMB_MCP; 3 THUMB_IP; 4 THUMB_TIP; 5 INDEX_FINGER_MCP; 6 INDEX_FINGER_PIP; 7 INDEX_FINGER_DIP; 8 INDEX_FINGER_TIP; 9 MIDDLE_FINGER_MCP; 10 MIDDLE_FINGER_PIP; 11 MIDDLE_FINGER_DIP; 12 MIDDLE_FINGER_TIP; 13 RING_FINGER_MCP; 14 RING_FINGER_PIP; 15 RING_FINGER_DIP; 16 RING_FINGER_TIP; 17 PINKY_MCP; 18 PINKY_PIP; 19 PINKY_DIP; 20 PINKY_TIP.
- The installed `HandLandmarker.HAND_CONNECTIONS` table agrees (0-1-2-3-4 thumb, 0-5, 5-6-7-8, 5-9, 9-10-11-12, 9-13, 13-14-15-16, 13-17, 0-17, 17-18-19-20).
- `design.md` (section 4 and 5.2): wrist 0, thumb tip 4, fingertips 8, 12, 16, 20, knuckles 5, 9, 13, 17. **Matches.** Coordinates are normalised 0 to 1 (`x`, `y`, plus `z`).

### 5. Face detector keypoints

- Documentation: each detection has `keypoints: NormalizedKeypoint[]` with `x` and `y` in 0.0 to 1.0, normalised by image width and height. There are 6 keypoints in this order: right eye (0), left eye (1), nose tip (2), **mouth centre (3)**, **right ear tragion (4)**, **left ear tragion (5)**.
- So the mouth is index 3, and the two ears are indices 4 and 5. Both are normalised 0 to 1.
- One sentence on the same page lists the eye order the other way round ("left eye, right eye"). That affects indices 0 and 1 only, which the game does not use.
- The documentation's words "right" and "left" are the model's own labels. The game does not read them (`FaceInput` has `edgeA` and `edgeB` with no side label), so nothing about left and right depends on them.
- `design.md` 8.1: "6 face points including the mouth centre and both ear points". **Matches**, but the design gives no indices; the adapter uses 3, 4 and 5.
- STOP rule 1A.4 does not apply: the detector gives a usable mouth point and two ear points.

### 6. Face mesh: mouth centre and the two face edges

- The documentation pages say only that the model returns 478 normalised 3D landmarks. They do not list index numbers for the mouth or the face edges.
- Checked in the installed package by printing its connection tables:
  - `FACE_LANDMARKS_LIPS` contains indices 13 and 14 (and 0, 17, 61, 291 and others). 13 and 14 are the inner upper-lip and inner lower-lip points.
  - `FACE_LANDMARKS_FACE_OVAL` contains indices 234 and 454 (and 10, 152 and others). These are the two points on the face outline at the sides.
- What this proves: 13 and 14 are lip points and 234 and 454 are face-outline points. What it does not prove: that 234 and 454 are the widest points at eye-to-mouth height, or that the midpoint of 13 and 14 is the mouth centre. Those two statements rest on common use of the mesh, not on the documentation. The debug page (task 1H) shows the points on screen, so Dr. Yatin can see whether they sit where expected.
- `design.md` has no mesh indices. The adapter (task 1E) uses: mouth = midpoint of 13 and 14; `edgeA` = 234; `edgeB` = 454. The mesh is a fallback only (`FACE_MODEL = 'detector'` by default).

### 7. `detectForVideo`

- From `vision.d.ts`, the same shape on all three classes:
  - `FaceDetector.detectForVideo(videoFrame: ImageSource, timestamp: number, imageProcessingOptions?: ImageProcessingOptions): DetectionResult`
  - `HandLandmarker.detectForVideo(videoFrame: ImageSource, timestamp: number, imageProcessingOptions?: ImageProcessingOptions): HandLandmarkerResult`
  - `FaceLandmarker.detectForVideo(videoFrame: ImageSource, timestamp: number, imageProcessingOptions?: ImageProcessingOptions): FaceLandmarkerResult`
- It is synchronous. `timestamp` is in milliseconds and must go up from call to call. It works only when the task was created with running mode `VIDEO`.
- Results: `DetectionResult.detections[i].keypoints` (face detector); `HandLandmarkerResult.landmarks[hand][0..20]` (hand); `FaceLandmarkerResult.faceLandmarks[face][0..477]` (mesh).
- `design.md` names `detectForVideo` but gives no signature. **No conflict.**

### 8. Location of the WASM files inside the package

- Folder: `node_modules/@mediapipe/tasks-vision/wasm/`. It holds four files:
  - `vision_wasm_internal.js` (336,624 bytes) and `vision_wasm_internal.wasm` (14,665,716 bytes)
  - `vision_wasm_module_internal.js` (336,662 bytes) and `vision_wasm_module_internal.wasm` (14,665,738 bytes)
- `FilesetResolver.forVisionTasks(basePath?: string, useModule?: boolean): Promise<WasmFileset>`. The installed code builds the file names `vision_wasm_internal.{js,wasm}` when `useModule` is false or absent, and `vision_wasm_module_internal.{js,wasm}` when it is true. It loads from `basePath` and, if no path is given, from the root of the host.
- The same four files are also in the package root. Task 1F copies from `wasm/` as the task says.
- Each `.wasm` file is about 14.7 MB. This is far above the 5 MB first-load budget, so the files must stay lazy-loaded (design 8.3). Only one pair is needed at run time (the default, non-module pair, if `useModule` is not set).
- `design.md` 8.1: "WASM runtime and its loader script", folder `wasm/`. **Matches**, with the file names and sizes now known.

### 9. GPU and CPU delegate

- From `vision.d.ts`, `BaseOptions` has `delegate?: "CPU" | "GPU" | undefined`, set inside `baseOptions` with `modelAssetPath`:
  `createFromOptions(wasmFileset, { baseOptions: { modelAssetPath, delegate: "GPU" }, runningMode: "VIDEO", numHands: 2 })`.
- `numHands` is an option of `HandLandmarker`; `numFaces` of `FaceLandmarker`. `runningMode` is `"VIDEO"` for `detectForVideo`.
- There is no separate call to switch delegate. The loader asks for `"GPU"` first and, if creation fails, creates the task again with `"CPU"`.
- `design.md` (8.1, loader description in the tasks): GPU first, CPU fallback. **Matches.**

## Corrections to design.md

`design.md` is not edited by this task. These are the facts the later tasks follow instead:

1. **Face detector file name.** The model file is `blaze_face_short_range.tflite`, not `face_detector.tflite`. Task 1G puts that file in `public/models/`, and the loader uses that name.
2. **Face detector point indices.** Mouth centre is keypoint 3; the two ear points are keypoints 4 and 5. All are normalised 0 to 1. `landmark-adapters.ts` uses these.
3. **Face mesh indices** (not given in `design.md`): mouth = midpoint of landmarks 13 and 14; face edges = landmarks 234 and 454. See item 6 for what is and is not proven.
4. **WASM files.** Four files, about 14.7 MB each for the `.wasm` ones. The default (non-module) pair is `vision_wasm_internal.js` and `vision_wasm_internal.wasm`. `scripts/copy-mediapipe-wasm.mjs` copies this pair; it copies the `module` pair only if the loader is later set to `useModule: true`.
5. **Size effect.** One WASM binary alone is about 14.7 MB. This does not break the first-load limit (the files load only after the tap) but design 8.2's "total loaded in camera mode" will be large. Dr. Yatin should know this before the phone speed check (task 10).
6. **Package version.** The installed version is 1.2.3. Later tasks follow its type definitions.

## Measured sizes

Output of `npm run measure-assets`, copied as printed (task 1G.4).

| File | Size in bytes | Date |
|------|---------------|------|
| .gitkeep | 0 | 2026-11-20 |
| blaze_face_short_range.tflite | 229746 | 2026-11-20 |
| face_landmarker.task | 3758596 | 2026-11-20 |
| hand_landmarker.task | 7819105 | 2026-11-20 |
| wasm/vision_wasm_internal.js | 336624 | 2026-11-20 |
| wasm/vision_wasm_internal.wasm | 14665716 | 2026-11-20 |
| total | 26809787 | 2026-11-20 |
