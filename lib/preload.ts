/** Shared by the server boot script and the client preloader. */
export const SEEN_KEY = 'hs:seen';
/** Repeat visits within this window skip the preloader. */
export const SEEN_TTL_MS = 12 * 60 * 60 * 1000;
