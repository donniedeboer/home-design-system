import type { Profile } from "./ProfileProvider";

/** A small circular avatar: the profile's initial on its color. */
export default function ProfileAvatar({
  profile,
  size = 20,
  className = "",
}: {
  profile: Pick<Profile, "name" | "color"> | null | undefined;
  size?: number;
  className?: string;
}) {
  if (!profile) return null;
  const initial = profile.name.trim().charAt(0).toUpperCase() || "?";
  // The ONE identity treatment: accent-subtle circle + accent-text initials
  // (reused in the switcher, chat userbar, share rows, Persona who-am-I). A
  // per-profile `color` still overrides the fill when the app sets one.
  const custom = !!profile.color;
  return (
    <span
      title={profile.name}
      aria-label={profile.name}
      style={{
        background: profile.color ?? "var(--color-accent-subtle)",
        color: custom ? "rgba(0,0,0,0.8)" : "var(--color-accent-text)",
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${className}`}
    >
      {initial}
    </span>
  );
}
