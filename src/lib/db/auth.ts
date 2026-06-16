import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import type { AuthUser, UserRole } from "@/types/auth";

export const SESSION_COOKIE = "mp_session";
const SESSION_DAYS = 7;

export function toAuthUser(user: User, workshopName: string | null): AuthUser {
  return {
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    workshopId: user.workshopId,
    workshopName,
  };
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { workshop: { select: { name: true } } },
  });

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return toAuthUser(user, user.workshop?.name ?? null);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function getSessionUser(token: string | undefined): Promise<AuthUser | null> {
  if (!token || !isDatabaseConfigured()) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: { workshop: { select: { name: true } } },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return toAuthUser(session.user, session.user.workshop?.name ?? null);
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await prisma.session.deleteMany({ where: { token } });
  } catch {
    /* ignore */
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function newSessionExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}
