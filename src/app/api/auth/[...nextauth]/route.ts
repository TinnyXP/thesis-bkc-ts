import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials, req) {
        
        const { email, password } = credentials as { email: string; password: string };
        try {
          await connectDB();
          const user = await User.findOne({ email });

          if (!user) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            return null;
          }

          return user;
        }

        catch (error) {
          console.error("Error connecting to database:", error);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


// const authOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {},
//       async authorize(credentials, req) {
//         const user = { id: '1'}
//         return user
//       },
//     }),
//   ],
//   session : {
//     strategy: "jwt",
//   },
//   secert: process.env.NEXTAUTH_SECRET,
//   pages: {
//     signIn: "/login",
//   }
// };

// const handler = NextAuth(authOptions);

// import NextAuth, { NextAuthOptions } from 'next-auth';
// import LineProvider from "next-auth/providers/line";
// import { JWT } from "next-auth/jwt";
// import { Session } from "next-auth"

// export const authOptions: NextAuthOptions = {
//   providers: [
//       LineProvider({
//           authorization: { params: { scope: "openid profile email" } },
//           clientId: process.env.LINE_CLIENT_ID as string,
//           clientSecret: process.env.LINE_CLIENT_SECRET as string,
//       })
//   ],
//   secret: process.env.NEXTAUTH_SECRET as string,
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       // Persist the LINE profile info to the token
//       if (account && profile) {
//         token.lineProfile = profile;
//         token.accessToken = account.access_token;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       // Send LINE profile to the client
//       return session;
//     },
//     async redirect({ url, baseUrl }) {
//       // Redirect to home page after successful sign in
//       return baseUrl;
//     },
    
//   },
//   pages: {
//     signIn: '/login',
//   }
// }


// const handler = NextAuth(authOptions)
// export { handler as GET, handler as POST }