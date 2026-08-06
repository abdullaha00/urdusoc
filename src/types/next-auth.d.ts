import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Committee role from the `admins` table; undefined if not an admin. */
      role?: "owner" | "editor";
    } & DefaultSession["user"];
  }
}
