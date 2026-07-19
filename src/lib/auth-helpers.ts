import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Returns the current session or null. */
export async function getSession() {
  return auth();
}

/** Requires any authenticated user. Redirects to /login otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/** Requires an ADMIN user. Redirects otherwise. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session.user;
}

/** Requires a STUDENT user (admins are sent to their own area). */
export async function requireStudent() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  return session.user;
}
