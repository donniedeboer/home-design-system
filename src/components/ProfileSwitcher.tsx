"use client";
import { useState } from "react";
import { useProfiles } from "./ProfileProvider";
import ProfileAvatar from "./ProfileAvatar";

/** Nav control: shows the active profile; click to switch (Netflix-style). */
export default function ProfileSwitcher() {
  const { profiles, active, setActive } = useProfiles();
  const [open, setOpen] = useState(false);
  if (!active) return null;

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none"
        title={`Profile: ${active.name}`}
      >
        <ProfileAvatar profile={active} size={22} />
        <span className="hidden text-sm font-medium text-fg sm:inline">{active.name}</span>
        <span aria-hidden className="text-fg-subtle">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 z-40 mt-1 min-w-44 rounded-lg border border-border bg-surface-0 p-1 shadow-pop"
          >
            <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
              Switch profile
            </div>
            {profiles.map((p) => (
              <button
                key={p.id}
                role="menuitemradio"
                aria-checked={p.id === active.id}
                onClick={() => {
                  setActive(p.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2"
              >
                <ProfileAvatar profile={p} size={22} />
                <span className="flex-1 text-left">{p.name}</span>
                {p.id === active.id && <span className="text-accent-text">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
