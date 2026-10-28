/**
 * @module components/admin
 *
 * Operator console: the `/admin` shell with its gate, frame and inspector, and
 * the overview, activity, recording and streamer views rendered inside it.
 */
export { OperatorConsole } from "./operator-console";
export { Overview } from "./overview/overview";
export { Activity } from "./activity/activity";
export { RecordingView } from "./recording-view";
export { StreamerInventory, StreamerList } from "./streamers";
export type { InspectTarget } from "./lib/inspect";
