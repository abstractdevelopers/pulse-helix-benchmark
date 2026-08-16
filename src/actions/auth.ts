"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createUser,
  findUserByEmail,
  verifyPassword,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  deleteSession,
  getSession,
} from "@/lib/auth";
import { signupSchema, loginSchema } from "@/lib/validations";

export async function signupAction(prevState: unknown, formData: FormData) {
  const result = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  const { name, email, password } = result.data;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  const user = await createUser(name, email, password);
  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginAction(prevState: unknown, formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      error: result.error.issues[0].message,
    };
  }

  const { email, password } = result.data;

  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password" };
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    const cookieStore = await import("next/headers").then((m) => m.cookies());
    const token = (await cookieStore).get("session")?.value;
    if (token) {
      await deleteSession(token);
    }
  }
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}