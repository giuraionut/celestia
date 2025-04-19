
import argon2 from "argon2";
import { AuthOptions, User as NextAuthUser, Account as NextAuthAccount, } from "next-auth"; // Import necessary types
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./db";
import { User as PrismaUser } from "@prisma/client";
import { toast } from "sonner";



declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        name?: string | null;
        email?: string | null;
        picture?: string | null;
    }
}


type ProviderUserInfo = Pick<NextAuthUser, 'email' | 'name' | 'image'>;
type ProviderAccountInfo = Pick<NextAuthAccount, 'provider' | 'providerAccountId' | 'type' | 'access_token' | 'refresh_token' | 'expires_at' | 'id_token' | 'scope' | 'session_state' | 'token_type'>;

/**
 * Finds an existing user by email or creates a new one using provider details,
 * then ensures the specific OAuth provider account is linked to the user.
 * This operation is performed within a database transaction for atomicity.
 * Persisted user profile data (name, image) is NOT overwritten by provider
 * data if the user already exists.
 *
 * @param userProfile - User profile data from the OAuth provider (must include email).
 * @param account - OAuth account details from NextAuth.
 * @returns The PrismaUser record (found or created).
 * @throws Error if email is missing or if the database transaction fails.
 */
const fetchOrCreateUser = async (
    userProfile: ProviderUserInfo,
    account: ProviderAccountInfo
): Promise<PrismaUser> => {
    const { email, name: providerName, image: providerImage } = userProfile;
    const { provider, providerAccountId, type } = account;

    if (!email) {
        console.error("OAuth Error: Email is missing from provider profile.");
        throw new Error("Email is required for OAuth sign-in.");
    }

    try {
        const userInDb = await db.$transaction(async (tx) => {
            let localUser = await tx.user.findUnique({
                where: { email },
            });

            if (!localUser) {
                localUser = await tx.user.create({
                    data: {
                        email,
                        name: providerName || null,
                        image: providerImage || null,
                        emailVerified: new Date(),
                    },
                });
            }

            if (!localUser) {
                throw new Error("Failed to find or create user within transaction.");
            }

            const userId = localUser.id;

            const existingAccount = await tx.account.findFirst({
                where: { userId: userId, provider: provider, providerAccountId: providerAccountId },
                select: { id: true }
            });

            if (!existingAccount) {
                await tx.account.create({
                    data: {
                        userId: userId,
                        type: type,
                        provider: provider,
                        providerAccountId: providerAccountId,
                        access_token: account.access_token,
                        refresh_token: account.refresh_token,
                        expires_at: account.expires_at,
                        id_token: account.id_token,
                        scope: account.scope,
                        session_state: account.session_state,
                        token_type: account.token_type,
                    },
                });
            }

            return localUser;
        });
        return userInDb;
    } catch (error) {
        console.error("[Auth] Error in fetchOrCreateUser transaction:", error);
        throw new Error("Database operation failed during sign-in.");
    }
};


// --- Main Auth Options ---
export const authOptions: AuthOptions = {
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const { email, password } = credentials || {};
                if (!email || !password) throw new Error("Email and password required");

                const user = await db.user.findUnique({ where: { email } });
                if (!user || !user.password) throw new Error("Invalid credentials");

                const isValid = await argon2.verify(user.password, password);
                if (!isValid) throw new Error("Invalid credentials");

                return {
                    id: user.id, // The database CUID
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        /**
         * signIn: Called after successful authentication (OAuth) or authorize (Credentials).
         * Responsible for linking accounts and ensuring the user object passed forward has the DB ID.
         */
        async signIn({ user, account, profile }) {
            if (account?.provider === "credentials") {
                return true;
            }

            if (account && profile && user) {
                try {
                    const providerUserInfo: ProviderUserInfo = {
                        email: profile.email,
                        name: profile.name ?? user.name,
                        image: profile.image ?? user.image,
                    };

                    const prismaUser = await fetchOrCreateUser(providerUserInfo, account);

                    user.id = prismaUser.id;


                    return true;

                } catch (error) {
                    toast.error('Something went wrong, please try again later.', {
                        description: (error as Error).message,
                    });
                    return false;
                }
            }

            console.warn("[SignIn] Denying sign-in due to missing account/profile/user.");
            return false;
        },

        /**
         * jwt: Called whenever a JWT is created or updated.
         * - On initial sign-in, receives `user`. Populates token with DB ID and essential info.
         * - On update trigger, receives `trigger: "update"` and client `session` data. Refetches from DB to update token.
         * - On regular requests, receives only `token`. Returns it (potentially after validation).
         */
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async jwt({ token, user, account, profile, trigger, session }) {

            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
            }

            if (trigger === "update" && token.id) {

                try {

                    const dbUser = await db.user.findUnique({
                        where: { id: token.id },
                        select: { name: true, email: true, image: true }
                    });
                    if (dbUser) {
                        token.name = dbUser.name;
                        token.email = dbUser.email;
                        token.picture = dbUser.image;
                    } else {
                        toast.error('Something went wrong, please try again later.');
                    }
                } catch (error) {
                    toast.error('Something went wrong, please try again later.', {
                        description: (error as Error).message,
                    });
                }

            }

            return token;
        },

        /**
         * session: Called whenever a session is accessed (getServerSession, useSession).
         * Creates the session object that is returned to the client/server component.
         * It MUST receive the token to access potentially updated data.
         */
        async session({ session, token }) {
            if (token?.id) {
                const fresh = await db.user.findUnique({
                    where: { id: token.id },
                    select: { name: true, email: true, image: true },
                });
                if (fresh) {
                    session.user = {
                        ...session.user,
                        name: fresh.name,
                        email: fresh.email,
                        image: fresh.image,
                        id: token.id,
                    };
                } else {
                    session.user.id = token.id;
                    session.user.name = token.name;
                    session.user.email = token.email;
                    session.user.image = token.picture;
                }
            } else {
                toast.error("Something went wrong, please try again later.");
                session.user = { ...session.user, id: undefined, name: null, email: null, image: null };
            }
            return session;
        },
    },
};

