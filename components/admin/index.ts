/**
 * @module components/admin
 *
 * Operator console: the `/admin` shell with its gate, frame and inspector, and
 * the overview, activity, recording, streamer and ingestion views rendered inside it.
 */
export { OperatorConsole } from "./operator-console";
export { Overview } from "./overview/overview";
export { Activity } from "./activity/activity";
export { RecordingView } from "./recording-view";
export { StreamerInventory, StreamerList } from "./streamers";
export { Ingestion } from "./ingestion";
export type { InspectTarget } from "./lib/inspect";
