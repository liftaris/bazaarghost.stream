import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const paths = process.argv.slice(2);
assert.ok(paths.length, "Pass one or more browser capture report.json paths");

for (const path of paths) {
  const report = JSON.parse(readFileSync(path, "utf8"));
  const failures = [];
  let captures = 0;
  for (const [state, viewports] of Object.entries(report.results)) {
    for (const [viewport, result] of Object.entries(viewports)) {
      captures++;
      const problems = [];
      if (!result.settled) problems.push("page did not settle");
      if (result.acted.some((acted) => acted !== true)) problems.push("interaction did not complete");
      if (!result.text?.includes("Overview")) problems.push("console did not render");
      if (result.audit.document.overflowX > 1) problems.push("document overflows horizontally");
      if (result.audit.spills.some((spill) => !spill.withinScroller)) problems.push("content escapes its scroll container");
      if (result.audit.overlaps.length) problems.push(`${result.audit.overlaps.length} text overlaps`);
      if (problems.length) failures.push({ state, viewport, problems });
    }
  }
  console.log(JSON.stringify({ path, captures, failures }, null, 2));
  assert.ok(captures > 0, "Report contains browser captures");
  assert.equal(failures.length, 0, "Every browser capture must pass the layout checks");
}
