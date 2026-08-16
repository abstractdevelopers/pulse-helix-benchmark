import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, sessions } from "./schema";
import { hash, compare } from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}

export async function createUser(
  name: string,
  email: string,
  password: string
) {
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning();
  return user;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await db.insert(sessions).values({ userId, token, expiresAt });
  return { token, expiresAt };
}

export async function validateSession(token: string) {
  const [session] = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token));

  if (!session || session.session.expiresAt < new Date()) {
    if (session) {
      await db.delete(sessions).where(eq(sessions.id, session.session.id));
    }
    return null;
  }

  return session.user;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return validateSession(token);
}

export function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}