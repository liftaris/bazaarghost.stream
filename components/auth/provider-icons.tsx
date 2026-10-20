import { siDiscord } from "simple-icons";
import { BrandIcon, PlatformIcon } from "@/components/platform-icon";
import type { AuthProviderId } from "@/lib/auth-client";

type IconProps = React.ComponentProps<"svg">;

function Discord(props: IconProps) {
  return <BrandIcon icon={siDiscord} {...props} />;
}

function Twitch(props: IconProps) {
  return <PlatformIcon platform="twitch" decorative {...props} />;
}

export const PROVIDERS: Record<
  AuthProviderId,
  { label: string; Icon: (props: IconProps) => React.JSX.Element }
> = {
  discord: { label: "Discord", Icon: Discord },
  twitch: { label: "Twitch", Icon: Twitch },
};

export function isKnownProvider(id: string): id is AuthProviderId {
  return id in PROVIDERS;
}
