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
  return (
    <span
      title={profile.name}
      aria-label={profile.name}
      style={{
        background: profile.color ?? "var(--color-surface-3)",
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none text-black/80 ${className}`}
    >
      {initial}
    </span>
  );
}
