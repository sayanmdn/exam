import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const dbUser = user as {
          role?: string;
          status?: string;
          profileCompleted?: boolean;
          phone?: string | null;
        };
        session.user.id = user.id;
        // `role`, `status`, `profileCompleted` and `phone` live on our
        // extended User model. With the database session strategy these are
        // read fresh from Neon on every request, so a teacher's approval takes
        // effect on the student's very next page load.
        session.user.role = dbUser.role ?? "STUDENT";
        session.user.status = dbUser.status ?? "PENDING";
        session.user.profileCompleted = dbUser.profileCompleted ?? false;
        session.user.phone = dbUser.phone ?? null;
      }
      return session;
    },
  },
  events: {
    // Promote configured emails to ADMIN the first time they sign up.
    // Admins (teachers) skip the student validation flow entirely.
    async createUser({ user }) {
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN", status: "APPROVED", profileCompleted: true },
        });
      }
    },
    // Keep admin status in sync for existing users if the list changes.
    async signIn({ user }) {
      if (
        user.id &&
        user.email &&
        adminEmails.includes(user.email.toLowerCase())
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN", status: "APPROVED", profileCompleted: true },
        });
      }
    },
  },
});
