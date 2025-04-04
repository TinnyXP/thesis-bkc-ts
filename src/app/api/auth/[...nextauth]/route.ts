import NextAuth, { NextAuthOptions } from 'next-auth';
import LineProvider from "next-auth/providers/line";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
      LineProvider({
          authorization: { params: { scope: "openid profile email" } },
          clientId: process.env.LINE_CLIENT_ID as string,
          clientSecret: process.env.LINE_CLIENT_SECRET as string,
      })
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the LINE profile info to the token
      if (account && profile) {
        token.lineProfile = profile;
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send LINE profile to the client
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to home page after successful sign in
      return baseUrl;
    },
    
  },
  pages: {
    signIn: '/login',
  }
}


const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }