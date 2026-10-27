import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config.ts";
import { jsxRuntime, sourceModules } from "./helpers/source-harness.mjs";

process.env.NODE_ENV = "production";
process.env.__VINEXT_IMAGE_REMOTE_PATTERNS = JSON.stringify(nextConfig.images.remotePatterns);
process.env.__VINEXT_IMAGE_UNOPTIMIZED = "false";
const { getImageProps } = await import("vinext/shims/image");

test("AvatarImage sends the referrer policy through vinext to Radix's image preloader", () => {
  const load = sourceModules({
    react: {},
    "react/jsx-runtime": jsxRuntime,
    "@radix-ui/react-avatar": { Image: "AvatarImage" },
    "next/image": { getImageProps },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  });
  const { AvatarImage } = load("@/components/ui/avatar");
  const src = "https://i2.hdslb.com/bfs/face/avatar.jpg";
  const image = AvatarImage({ src, alt: "Creator" });
  assert.equal(image.props.src, src);
  assert.equal(image.props.referrerPolicy, "no-referrer");
});

test("vinext preserves Bilibili avatar URLs in production alongside Twitch and Discord", () => {
  for (const src of [
    "https://i0.hdslb.com/bfs/face/avatar.jpg",
    "https://i2.hdslb.com/bfs/face/5ac70ad43b5c1d1383530b2f9ad93384af82870e.jpg",
    "https://static-cdn.jtvnw.net/jtv_user_pictures/avatar.png",
    "https://cdn.discordapp.com/avatars/123/avatar.png",
  ]) {
    const { props } = getImageProps({ src, alt: "Creator", width: 48, height: 48, quality: 75 });
    assert.equal(props.src, src);
    assert.equal(props.srcSet, undefined);
  }
});

test("vinext rejects non-avatar Bilibili paths and lookalike domains in production", () => {
  for (const src of [
    "https://i2.hdslb.com/bfs/archive/video.jpg",
    "https://i2.hdslb.com.evil.example/bfs/face/avatar.jpg",
    "http://i2.hdslb.com/bfs/face/avatar.jpg",
  ]) {
    assert.equal(getImageProps({ src, alt: "Creator", width: 48, height: 48 }).props.src, "");
  }
});
