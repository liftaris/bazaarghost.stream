import assert from "node:assert/strict";
import test from "node:test";
import { elements, hooks, jsxRuntime, sourceModules } from "./helpers/source-harness.mjs";

test("calendar is ready on first open and keeps its renderer through rerenders", () => {
  const state = hooks();
  const LoadedCalendar = () => null;
  const load = sourceModules({
    react: state.react,
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": { CalendarIcon: "CalendarIcon", X: "X" },
    "@/components/ui/button": { Button: "Button" },
    "@/components/ui/calendar": { Calendar: LoadedCalendar },
    "@/components/ui/popover": { Popover: "Popover", PopoverContent: "PopoverContent", PopoverTrigger: "PopoverTrigger" },
    "@/lib/utils": { cn: (...classes) => classes.filter(Boolean).join(" ") },
    "@/lib/platforms": { isKnownPlatform: () => true },
  });
  const { DateFilter } = load("@/components/search/date-filter");
  const picker = DateFilter({ from: null, to: null, onChange() {} }).props.children[0];
  const render = () => elements(state.render(() => picker.type(picker.props)));
  let tree = render();
  tree.find(element => element.type === "Popover").props.onOpenChange(true);
  tree = render();
  assert.ok(tree.some(element => element.type === LoadedCalendar));
  tree = render();
  assert.ok(tree.some(element => element.type === LoadedCalendar));
  tree.find(element => element.type === "Popover").props.onOpenChange(false);
  tree = render();
  tree.find(element => element.type === "Popover").props.onOpenChange(true);
  tree = render();
  assert.ok(tree.some(element => element.type === LoadedCalendar));
});
