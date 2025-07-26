import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./database";

export const authOptions: NextAuthOptions = {
  // Re-enable Prisma adapter for production
  adapter: PrismaAdapter(prisma),
  providers: [
    // Only include SpareBank1 provider if credentials are available
    ...(process.env.SPAREBANK1_CLIENT_ID && process.env.SPAREBANK1_CLIENT_SECRET
      ? [
          {
            id: "sparebank1",
            name: "SpareBank1",
            type: "oauth" as const,
            authorization: {
              url: "https://api-auth.sparebank1.no/oauth/authorize",
              params: {
                scope: "accounts transactions",
                response_type: "code",
                // You'll need to add your bank's finInst parameter - examples:
                // finInst: "fid-smn" (for SpareBank1 SMN)
                // finInst: "fid-sor" (for SpareBank1 Sør-Norge)
                // See https://developersparebank1.no/personlig-klient for your bank's identifier
                finInst: process.env.SPAREBANK1_FIN_INST || "fid-smn", // Default to SMN, but should be configured
              },
            },
            token: "https://api-auth.sparebank1.no/oauth/token",
            userinfo: "https://api.sparebank1.no/personal/user/info",
            clientId: process.env.SPAREBANK1_CLIENT_ID,
            clientSecret: process.env.SPAREBANK1_CLIENT_SECRET,
            profile(profile: any) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                sparebank1UserId: profile.sub,
              };
            },
          },
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.sparebank1UserId = user.sparebank1UserId;

        // Store tokens in database
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              tokenExpiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
              sparebank1UserId: user.sparebank1UserId,
            },
          });
        } catch (error) {
          console.error("Failed to update user tokens:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.expiresAt = token.expiresAt;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      return true;
    },
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
