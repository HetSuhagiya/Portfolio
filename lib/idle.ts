type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Run a callback when the browser is idle (with a timeout fallback). Returns a cancel function. */
export function onIdle(cb: () => void, timeout = 1000): () => void {
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, Math.min(timeout, 200));
  return () => window.clearTimeout(id);
}
