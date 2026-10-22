"use client";

import { useEffect, useEffectEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEmbedActions, useEmbedState } from "@/components/embed-provider";
import { useBookmarkActions } from "@/components/social/bookmarks-provider";

const OVERLAY = '[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"]';
const EDITABLE = 'input,textarea,select,[contenteditable=""],[contenteditable="true"]';
const INTERACTIVE = `${EDITABLE},button,a[href],summary,[role="button"],[role="link"],[role="tab"],[role="slider"],[role="radio"],[role="checkbox"],[role="switch"],[role="menuitem"],[role="option"]`;

/** Mount once inside EmbedProvider. Handles YouTube-style player shortcuts. */
export function usePlayerHotkeys() {
  const actions = useEmbedActions();
  const state = useEmbedState();
  const bookmarks = useBookmarkActions();
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const { currentTime, duration } = actions.getTime();
    if (!state.videoId) return;

    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest(EDITABLE) || (target as HTMLElement | null)?.isContentEditable) return;
    if (target?.closest(OVERLAY) || document.querySelector(OVERLAY)) return;
    const interactive = !!target?.closest(INTERACTIVE);

    const caps = state.capabilities;
    const canSeek = !!caps?.seek;
    const seekBy = (delta: number) => {
      if (!canSeek) return;
      const max = duration > 0 ? duration : Infinity;
      actions.seek(Math.min(max, Math.max(0, currentTime + delta)));
    };
    const gotoGhost = actions.goToGhost;

    let handled = true;
    switch (e.key) {
      case " ":
        if (interactive) return;
        actions.togglePlay();
        break;
      case "k":
      case "K":
        actions.togglePlay();
        break;
      case "j":
      case "J":
        seekBy(-10);
        break;
      case "l":
      case "L":
        seekBy(10);
        break;
      case "ArrowLeft":
      case "ArrowRight": {
        if (interactive) return;
        const dir = e.key === "ArrowRight" ? "next" : "prev";
        if (e.shiftKey) gotoGhost(dir);
        else seekBy(dir === "next" ? 5 : -5);
        break;
      }
      case "n":
      case "N":
        gotoGhost("next");
        break;
      case "p":
      case "P":
        gotoGhost("prev");
        break;
      case "m":
      case "M":
        if (!caps?.mute) return;
        actions.toggleMute();
        break;
      case "f":
      case "F": {
        if (caps && !caps.fullscreen) return;
        const host = document.getElementById(actions.containerId)?.parentElement;
        if (document.fullscreenElement) void document.exitFullscreen();
        else void host?.requestFullscreen?.();
        break;
      }
      case "s":
      case "S": {
        const id = state.selectedGhost?.matchup_id;
        if (!id || !bookmarks.enabled) return;
        if (!bookmarks.signedIn) {
          router.push(`/login?next=${encodeURIComponent(pathname + (query ? `?${query}` : ""))}`);
        } else {
          void bookmarks.toggle(id);
        }
        break;
      }
      case "Escape":
        if (document.fullscreenElement) return;
        if (!state.isVisible) return;
        actions.hideEmbed();
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
