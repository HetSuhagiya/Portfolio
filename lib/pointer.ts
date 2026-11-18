/**
 * One pointer listener for the whole site. Mutable on purpose: read in the frame loop,
 * never through React state.
 */
export const pointer = {
  /** Client pixels. */
  x: -1,
  y: -1,
  /** Pixels moved since the last frame consumed them. */
  dx: 0,
  dy: 0,
  /** Smoothed speed in px/frame, for cursor and poster distortion. */
  speed: 0,
  active: false,
  down: false,
};

let users = 0;
let detach: (() => void) | null = null;

/** Reference-counted: several components can ask for the pointer, one listener is attached. */
export function attachPointer(): () => void {
  if (typeof window === 'undefined') return () => {};
  users++;
  const release = () => {
    users--;
    if (users === 0 && detach) {
      detach();
      detach = null;
    }
  };
  if (detach) return release;
  const move = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (pointer.active) {
      pointer.dx += e.clientX - pointer.x;
      pointer.dy += e.clientY - pointer.y;
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  };
  const down = () => (pointer.down = true);
  const up = () => (pointer.down = false);
  const leave = () => (pointer.active = false);
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', down, { passive: true });
  window.addEventListener('pointerup', up, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  detach = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    document.documentElement.removeEventListener('pointerleave', leave);
  };
  return release;
}
