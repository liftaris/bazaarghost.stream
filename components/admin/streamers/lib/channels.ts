import type { OpsChannelRef } from "@/lib/operator-contract";

/** Twitch display names differ from the login only by case, unless localized. */
const TWITCH_LOGIN = /^[a-z0-9_]{1,25}$/i;

const PROFILE: Record<string, (channel: OpsChannelRef) => string | null> = {
  twitch: (channel) =>
    channel.displayName && TWITCH_LOGIN.test(channel.displayName)
      ? `https://www.twitch.tv/${channel.displayName.toLowerCase()}`
      : null,
  youtube: (channel) => `https://www.youtube.com/channel/${encodeURIComponent(channel.sourceId)}`,
  bilibili: (channel) => `https://space.bilibili.com/${encodeURIComponent(channel.sourceId)}`,
};

/**
 * A channel's page on its platform, or null when the operator contract does
 * not carry enough to build it (a Twitch channel with a localized name).
 */
export function channelUrl(channel: OpsChannelRef): string | null {
  return PROFILE[channel.platform]?.(channel) ?? null;
}
