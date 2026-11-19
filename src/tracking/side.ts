// The only place in the code base where left and right are swapped (design 5.1, req 2.2).
// The camera frame is not mirrored, so the child's own left is on the raw right.
import type { Side } from '../logic/types';

export function rawToChildSide(raw: 'raw-left' | 'raw-right'): Side {
  return raw === 'raw-right' ? 'left' : 'right';
}
