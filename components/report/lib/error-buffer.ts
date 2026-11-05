const MAX = 10;
const errors: { at: string; message: string }[] = [];
let installed = false;

function push(message: string) {
  errors.push({ at: new Date().toISOString(), message: message.slice(0, 500) });
  if (errors.length > MAX) errors.shift();
}

/** Start remembering the last uncaught errors so a report can carry them. Idempotent. */
export function installErrorBuffer() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => push(e.error?.stack ?? e.message));
  window.addEventListener("unhandledrejection", (e) =>
    push(
      e.reason instanceof Error
        ? (e.reason.stack ?? e.reason.message)
        : String(e.reason)
    )
  );
}

/** The most recent uncaught errors, oldest first. */
export function recentErrors() {
  return [...errors];
}
