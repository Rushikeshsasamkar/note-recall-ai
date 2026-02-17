import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export const CREDENTIALS_SESSION_COOKIE = "credentials_session";

const sessionDays = Number(process.env.CREDENTIALS_SESSION_DAYS || "30");
const sessionMaxAgeSeconds = Number.isFinite(sessionDays) && sessionDays > 0
  ? sessionDays * 24 * 60 * 60
  : 30 * 24 * 60 * 60;

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getSessionExpiry() {
  return new Date(Date.now() + sessionMaxAgeSeconds * 1000);
}

export function setSessionCookie(token: string, expiresAt: Date) {
  cookies().set(CREDENTIALS_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie() {
  cookies().set(CREDENTIALS_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function createCredentialsSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = getSessionExpiry();

  await prisma.credentialsSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getCredentialsUserId() {
  const token = cookies().get(CREDENTIALS_SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.credentialsSession.findUnique({
    where: { tokenHash },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.credentialsSession.delete({ where: { id: session.id } });
    return null;
  }

  return session.userId;
}

export async function clearCredentialsSession(token?: string) {
  const tokenValue = token || cookies().get(CREDENTIALS_SESSION_COOKIE)?.value;
  if (!tokenValue) return;

  const tokenHash = hashToken(tokenValue);
  const session = await prisma.credentialsSession.findUnique({
    where: { tokenHash },
  });

  if (session) {
    await prisma.credentialsSession.delete({ where: { id: session.id } });
  }
}
