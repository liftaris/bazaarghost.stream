import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));

// Portable source-path tests: execute the real TS modules, replacing only environment boundaries.
// This is not a React renderer or browser/provider acceptance test.
export function sourceModules(stubs = {}) {
  const cache = new Map();
  function load(name, parent = root) {
    if (Object.hasOwn(stubs, name)) return stubs[name];
    const base = name.startsWith("@/")
      ? resolve(root, name.slice(2))
      : resolve(parent, name);
    const canonical = `@/${relative(root, base)}`;
    if (Object.hasOwn(stubs, canonical)) return stubs[canonical];
    const file = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
    if (!file) throw new Error(`Unstubbed dependency: ${name} from ${parent}`);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: file,
    });
    new Function("require", "exports", outputText)(
      (id) => load(id, dirname(file)),
      exports
    );
    return exports;
  }
  return load;
}

export const jsxRuntime = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
  Fragment: "Fragment",
};

export function hooks() {
  let cursor = 0;
  const cells = [],
    layouts = [],
    effects = [];
  const memo = (value, deps) => {
    const i = cursor++;
    if (
      !cells[i] ||
      !deps ||
      deps.some((d, j) => !Object.is(d, cells[i].deps?.[j]))
    )
      cells[i] = { value: value(), deps };
    return cells[i].value;
  };
  const effect = (queue) => (fn, deps) => {
    const i = cursor++;
    if (
      !cells[i] ||
      !deps ||
      deps.some((d, j) => !Object.is(d, cells[i].deps?.[j]))
    ) {
      const old = cells[i];
      cells[i] = { deps };
      queue.push(() => {
        old?.cleanup?.();
        cells[i].cleanup = fn();
      });
    }
  };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!cells[i])
        cells[i] = {
          value: typeof initial === "function" ? initial() : initial,
        };
      return [
        cells[i].value,
        (next) => {
          cells[i].value =
            typeof next === "function" ? next(cells[i].value) : next;
        },
      ];
    },
    useRef: (initial) => memo(() => ({ current: initial }), []),
    useMemo: memo,
    useCallback: (fn, deps) => memo(() => fn, deps),
    useEffect: effect(effects),
    useLayoutEffect: effect(layouts),
    useEffectEvent: (fn) => fn,
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    createContext: () => ({ Provider: "Provider" }),
  };
  return {
    react,
    render(fn) {
      cursor = 0;
      const result = fn();
      layouts.splice(0).forEach((f) => f());
      return result;
    },
    flushEffects() {
      effects.splice(0).forEach((f) => f());
    },
    unmount() {
      cells.forEach((cell) => cell?.cleanup?.());
    },
  };
}

export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

export const settle = () => new Promise((resolve) => setImmediate(resolve));

export function elements(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [
    node,
    ...elements(node.props?.children),
    ...elements(node.props?.header),
  ];
}
