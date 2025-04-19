import { authOptions } from "@/lib/auth";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
      user: {
          id: string | undefined;
      } & DefaultSession["user"];
  }
  interface User {
      id: string;
  }
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST };
