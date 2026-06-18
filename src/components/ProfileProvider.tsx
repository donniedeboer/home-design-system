"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Profile = { id: number; name: string; color: string | null };

type Ctx = {
  profiles: Profile[];
  active: Profile | null;
  setActive: (id: number) => void;
  byId: (id: number | null | undefined) => Profile | null;
};

const ProfileContext = createContext<Ctx | null>(null);

export function useProfiles() {
  const c = useContext(ProfileContext);
  if (!c) throw new Error("useProfiles must be used within <ProfileProvider>");
  return c;
}

function readCookie(name: string): number | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=(\\d+)`));
  return m ? Number(m[1]) : null;
}
function writeCookie(name: string, id: number) {
  document.cookie = `${name}=${id}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Loads household profiles and tracks the active one (Netflix-style; no auth). The active
 * id lives in a cookie so server routes can attribute new rows. Pass a UNIQUE `cookieName`
 * per app — cookies are host-scoped, so tailnet-shared apps would otherwise collide (keep
 * it in sync with the server's PROFILE_COOKIE). Requires a `/api/profiles` backend.
 */
export default function ProfileProvider({
  children,
  cookieName = "app_profile",
}: {
  children: React.ReactNode;
  cookieName?: string;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const j = await (await fetch("/api/profiles")).json();
        if (!alive) return;
        const list: Profile[] = j.profiles ?? [];
        setProfiles(list);
        const fromCookie = readCookie(cookieName);
        const valid = list.some((p) => p.id === fromCookie) ? (fromCookie as number) : (list[0]?.id ?? null);
        setActiveId(valid);
        if (valid != null) writeCookie(cookieName, valid);
      } catch {
        /* offline — leave empty */
      }
    })();
    return () => {
      alive = false;
    };
  }, [cookieName]);

  const setActive = useCallback(
    (id: number) => {
      setActiveId(id);
      writeCookie(cookieName, id);
    },
    [cookieName],
  );

  const value = useMemo<Ctx>(() => {
    const byId = (id: number | null | undefined) =>
      id == null ? null : (profiles.find((p) => p.id === id) ?? null);
    return { profiles, active: byId(activeId), setActive, byId };
  }, [profiles, activeId, setActive]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
