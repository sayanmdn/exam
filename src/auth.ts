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
        session.user.id = user.id;
        // `role` and `phone` live on our extended User model.
        session.user.role = (user as { role?: string }).role ?? "STUDENT";
        session.user.phone = (user as { phone?: string | null }).phone ?? null;
      }
      return session;
    },
  },
  events: {
    // Promote configured emails to ADMIN the first time they sign up.
    async createUser({ user }) {
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
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
          data: { role: "ADMIN" },
        });
      }
    },
  },
});
