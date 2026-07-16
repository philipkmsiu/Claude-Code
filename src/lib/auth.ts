import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getUserById, getUserByEmail } from "@/lib/repo";
import type { User } from "@/lib/types";

const COOKIE_NAME = "km_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8h session timeout

function secret(): string {
  return process.env.SESSION_SECRET || "dev-only-insecure-session-secret";
}

function sign(userId: string, issuedAt: number): string {
  const payload = `${userId}.${issuedAt}`;
  const mac = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

function verify(token: string): { userId: string; issuedAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, issuedAtStr, mac] = parts;
  const expected = crypto
    .createHmac("sha256", secret())
    .update(`${userId}.${issuedAtStr}`)
    .digest("hex");
  if (
    mac.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  ) {
    return null;
  }
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() / 1000 - issuedAt > MAX_AGE_SECONDS) return null; // expired
  return { userId, issuedAt };
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function login(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const token = sign(user.id, Math.floor(Date.now() / 1000));
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return user;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parsed = verify(token);
  if (!parsed) return null;
  const user = await getUserById(parsed.userId);
  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
