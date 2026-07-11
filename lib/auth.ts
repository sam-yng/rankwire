import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { seedTagWeights } from "@/prisma/seed";
import { db } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Google],
  pages: { signIn: "/signin" },
  events: {
    // First sign-in only: the adapter fires createUser once per user, and
    // seedTagWeights is idempotent (skipDuplicates) besides.
    createUser: async ({ user }) => {
      if (user.id) {
        await seedTagWeights(user.id);
      }
    },
  },
});
