import type { EvidenceField, FieldEvidence } from "@/lib/api-contract";
import type { OpsDetection } from "@/lib/operator-contract";
import { heroLabel } from "@/lib/session-summary";
import { detectionName, orMissing, yesNo } from "./detection";
import { MISSING } from "./format";

/** How one evidence field reads in the inspector. */
export interface DetectionField {
  label: string;
  /** The detection's value for this field, in words an operator scans. */
  value: (detection: OpsDetection) => string;
  /** False when the field has no value worth listing on this detection. */
  present: (detection: OpsDetection) => boolean;
}

const capitalize = (text: string | null) => (text ? text[0].toUpperCase() + text.slice(1) : MISSING);
const has = (key: keyof OpsDetection) => (detection: OpsDetection) => detection[key] != null;

/** Every evidence field in reading order: what the fight was, who, then the clock, then the outcome. */
export const DETECTION_FIELDS: Record<EvidenceField, DetectionField> = {
  encounter: { label: "Encounter", value: () => "Recognized", present: () => false },
  username: {
    label: "Name",
    value: (d) => {
      const name = detectionName(d);
      return name.note ? `${name.text} (${name.note})` : name.text;
    },
    present: () => true,
  },
  rank: { label: "Rank", value: (d) => capitalize(d.rank), present: has("rank") },
  ghostHero: { label: "Ghost hero", value: (d) => heroLabel(d.ghostHero), present: has("ghostHero") },
  streamerHero: { label: "Streamer hero", value: (d) => heroLabel(d.streamerHero), present: has("streamerHero") },
  igd: { label: "Day", value: (d) => (d.igd == null ? MISSING : `Day ${d.igd}`), present: has("igd") },
  winsRemaining: {
    label: "Wins left",
    value: (d) => (d.winsRemaining == null ? MISSING : `${d.winsRemaining} left`),
    present: has("winsRemaining"),
  },
  gameMode: { label: "Mode", value: (d) => capitalize(d.gameMode), present: has("gameMode") },
  tournamentWins: { label: "Tournament wins", value: (d) => orMissing(d.tournamentWins), present: has("tournamentWins") },
  tournamentLosses: {
    label: "Tournament losses",
    value: (d) => orMissing(d.tournamentLosses),
    present: has("tournamentLosses"),
  },
  lethal: { label: "Lethal", value: (d) => yesNo(d.lethal), present: has("lethal") },
};

/** Evidence fields in {@link DETECTION_FIELDS} order. */
export const FIELD_ORDER = Object.keys(DETECTION_FIELDS) as EvidenceField[];

/** Fields the detection has a value for but no per-field evidence, such as reads from legacy runs. */
export function fieldsWithoutEvidence(detection: OpsDetection): EvidenceField[] {
  return FIELD_ORDER.filter((field) => !detection.fieldEvidence[field] && DETECTION_FIELDS[field].present(detection));
}

/** When in the fight a frame was read. */
export const PHASE_LABELS: Record<FieldEvidence["phase"], string> = {
  intro: "Intro",
  pre_fight: "Before fight",
  post_fight: "After fight",
  unknown: "Unknown phase",
};
