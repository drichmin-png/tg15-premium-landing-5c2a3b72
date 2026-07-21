import { createHash, randomBytes } from "crypto";
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

export function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString("hex");
  const h = createHash("sha256").update(s + password).digest("hex");
  return { salt: s, hash: h };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const h = createHash("sha256").update(salt + password).digest("hex");
  return h === expectedHash;
}
