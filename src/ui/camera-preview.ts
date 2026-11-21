// The mirrored live preview and the monster layer (design 9.1, req 8.1, 8.4, 8.5, 8.7).
// Used only in a camera-mode session. It has no screenshot, recording or share control.
// The stage is mirrored for display by one CSS class; pixels and landmarks are never flipped
// (req 2.3). The monster slot carries its own flip in CSS so the art is not back to front.
// Styles are set through classes or element.style only (Content-Security-Policy).
import type { CameraSignalSource } from '../tracking/camera-source';
import type { Anchor } from './monster-anchor';

/** The one CSS class that mirrors the stage for display (see styles.css). */
export const MIRROR_CLASS = 'preview--mirrored';
/** Put on the monster slot when there is no anchor: the monster sits where the plain screen puts it. */
export const PLAIN_CLASS = 'preview__monster--plain';

export interface CameraPreview {
  /** The stage element: video and monster layer. The caller adds it to the page. */
  readonly element: HTMLElement;
  /** The slot where the monster is drawn. The session screen puts the monster element here. */
  readonly monsterSlot: HTMLElement;
  /** Shows the source's camera stream in the preview's video element. */
  attach(source: CameraSignalSource): void;
  /** Places the monster. `null` puts it back at the plain session screen position, with no message. */
  placeMonster(anchor: Anchor | null): void;
  /** Removes the preview and lets go of the video. */
  destroy(): void;
}

function toPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

export function createCameraPreview(): CameraPreview {
  const stage = document.createElement('div');
  stage.className = `preview ${MIRROR_CLASS}`;

  const video = document.createElement('video');
  video.className = 'preview__video';
  video.playsInline = true;
  video.muted = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');

  const slot = document.createElement('div');
  slot.className = `preview__monster ${PLAIN_CLASS}`;

  stage.append(video, slot);

  function placeMonster(anchor: Anchor | null): void {
    if (anchor === null) {
      slot.classList.add(PLAIN_CLASS);
      slot.style.left = '';
      slot.style.top = '';
      slot.style.width = '';
      slot.style.transform = '';
      return;
    }
    slot.classList.remove(PLAIN_CLASS);
    slot.style.left = toPercent(anchor.x);
    slot.style.top = toPercent(anchor.y);
    slot.style.width = toPercent(anchor.size);
    // Centre on the point, then turn with the head. The flip back is done by the stylesheet.
    slot.style.transform = `translate(-50%, -50%) rotate(${anchor.rotate.toFixed(4)}rad) scaleX(-1)`;
  }

  return {
    element: stage,
    monsterSlot: slot,
    attach(source: CameraSignalSource): void {
      source.attachVideo(video);
    },
    placeMonster,
    destroy(): void {
      video.srcObject = null;
      stage.remove();
    },
  };
}
