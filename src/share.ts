/**
 * The suite-wide SHARE-LINK contract (server-safe: no React, exported via `/spec` too).
 * Reference implementation: Omni's chat sharing; the standard is documented in
 * home-dev-common/SHARING.md. The shape every app follows:
 *
 *   - ONE unguessable token per shared resource, stored ON the resource's meta —
 *     minting is IDEMPOTENT (re-share returns the same link), deleting the resource
 *     revokes it, no expiry.
 *   - Routes: POST <resource>/share → {token, url} · GET /share/<...token> → read-only
 *     viewer · the viewer's data endpoint does NO auth — the tailnet is the perimeter
 *     (apps bind loopback behind `tailscale serve`; the link resolves only on-tailnet).
 *   - The viewer is READ-ONLY: no actions, no editing affordances, authors labeled.
 */

/** Accepted token shape (Omni's contract): URL-safe base64, 8–64 chars. */
export const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Mint a share token — the JS equivalent of Python's `secrets.token_urlsafe(16)`:
 * 16 crypto-random bytes, base64url, no padding (~22 chars). Works in Node ≥18 and
 * every modern browser (globalThis.crypto + btoa).
 */
export function mintShareToken(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
