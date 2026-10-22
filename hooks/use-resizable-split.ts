"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type {
  GroupImperativeHandle,
  Layout,
  LayoutChangedMeta,
} from "react-resizable-panels";
import { useStoredSplit } from "./use-stored-split";
import { useIsMobile } from "./use-mobile";

/** Keep the existing preferences; only deliberate resizing may rewrite them. */
export function useResizableSplit(
  name: string,
  initial: number,
  leading: string,
  trailing: string,
  active = true
) {
  const split = useStoredSplit(name, initial);
  const { change, commit } = split;
  const groupRef = useRef<GroupImperativeHandle | null>(null);
  const compact = useIsMobile();
  const [collapsed, setCollapsed] = useState({
    leading: false,
    trailing: false,
  });
  const onLayoutChange = useCallback(
    (layout: Layout) => {
      const next = {
        leading: layout[leading] === 0,
        trailing: layout[trailing] === 0,
      };
      setCollapsed((previous) =>
        previous.leading === next.leading && previous.trailing === next.trailing
          ? previous
          : next
      );
    },
    [leading, trailing]
  );
  useEffect(() => {
    if (!compact && active)
      groupRef.current?.setLayout({
        [leading]: split.ratio * 100,
        [trailing]: (1 - split.ratio) * 100,
      });
  }, [compact, active, split.ratio, leading, trailing]);
  const onLayoutChanged = useCallback(
    (_layout: Layout, meta: LayoutChangedMeta) => {
      if (!meta.isUserInteraction || compact) return;
      const layout = meta.requestedLayout ?? _layout;
      change(layout[leading] / 100);
      commit();
    },
    [compact, leading, change, commit]
  );
  const restoreOnEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    split.restore();
  };
  return {
    groupRef,
    compact,
    onLayoutChange,
    leadingCollapsed: active && !compact && collapsed.leading,
    trailingCollapsed: active && !compact && collapsed.trailing,
    onLayoutChanged,
    restore: split.restore,
    restoreOnEnter,
  };
}
