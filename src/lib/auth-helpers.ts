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

/**
 * Requires a fully validated STUDENT. Admins are sent to their own area,
 * students who haven't finished onboarding are routed to complete their
 * profile, and those still awaiting a teacher's validation see the pending
 * screen. Only APPROVED students reach the portal itself.
 */
export async function requireStudent() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  if (!session.user.profileCompleted) {
    redirect("/onboarding");
  }
  if (session.user.status !== "APPROVED") {
    redirect("/pending");
  }
  return session.user;
}
