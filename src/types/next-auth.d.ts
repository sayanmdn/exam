import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
      profileCompleted: boolean;
      phone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    status?: string;
    profileCompleted?: boolean;
    phone?: string | null;
  }
}
