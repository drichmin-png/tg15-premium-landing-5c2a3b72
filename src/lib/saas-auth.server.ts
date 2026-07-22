import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { useSession } from "@tanstack/react-start/server";

export type SaasRole = "master" | "owner" | "staff";

export type SaasSessionData = {
  userId?: string;
  username?: string;
  role?: SaasRole;
  tenantId?: string | null;
  tenantSlug?: string | null;
  impersonation?: {
    masterUserId: string;
    masterUsername: string;
    logId: string;
  };
};

function sessionConfig() {
  const password = process.env.SAAS_SESSION_SECRET;
  if (!password) throw new Error("SAAS_SESSION_SECRET não configurado");
  return {
    password,
    name: "saas-session",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: true,
      path: "/",
    },
  };
}

export async function getSaasSession() {
  return useSession<SaasSessionData>(sessionConfig());
}

function isBcryptHash(hash: string) {
  return typeof hash === "string" && /^\$2[aby]\$/.test(hash);
}

/**
 * Hash a password with bcrypt.
 * `salt` is kept for schema compatibility with the existing `app_users` table
 * (which has a NOT NULL `password_salt` column) but is unused — bcrypt embeds
 * its own salt inside the hash.
 */
export function hashPassword(password: string, _salt?: string) {
  return { salt: "", hash: bcrypt.hashSync(password, 10) };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  if (isBcryptHash(expectedHash)) {
    return bcrypt.compareSync(password, expectedHash);
  }
  // Legacy fallback: fast SHA-256 with prepended salt. Kept only so pre-existing
  // rows can still log in; callers should re-hash to bcrypt on next successful login.
  const legacy = createHash("sha256").update(salt + password).digest("hex");
  return legacy === expectedHash;
}
