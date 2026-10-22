/** Synchronous latest-intent fence shared by asynchronous playback requests and direct selections. */
export function createPlaybackIntent() {
  let version = 0;
  return {
    begin: () => ++version,
    getVersion: () => version,
    isCurrent: (intent: number) => version === intent,
  };
}
