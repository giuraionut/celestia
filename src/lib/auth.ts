
import argon2 from "argon2";
import { AuthOptions, User as NextAuthUser, Account as NextAuthAccount, } from "next-auth"; // Import necessary types
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./db";
import { User as PrismaUser } from "@prisma/client";



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
 * fetchOrCreateUser: Finds or creates a user and links the OAuth account.
 * NOTE: As provided, this updates user name/image from provider on *every* login.
 * Consider modifying this if you want user settings to persist over provider data.
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
            let localUser = await tx.user.findUnique({ where: { email } });

            if (!localUser) {
                // Create user using provider details
                console.log(`[Auth] Creating new user for email: ${email}`);
                localUser = await tx.user.create({
                    data: {
                        email,
                        name: providerName || null,
                        image: providerImage || null,
                        emailVerified: new Date(),
                    },
                });
            } else {
                console.log(`[Auth] Found existing user for email: ${email} (ID: ${localUser.id}). Updating name/image from provider.`);
                localUser = await tx.user.update({ // Assign updated user back to localUser
                    where: { id: localUser.id },
                    data: { name: providerName, image: providerImage }
                });
            }

            const userId = localUser.id;

            const existingAccount = await tx.account.findFirst({
                where: { userId: userId, provider: provider, providerAccountId: providerAccountId },
                select: { id: true }
            });

            if (!existingAccount) {
                console.log(`[Auth] Linking ${provider} account for user ID: ${userId}`);
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
            console.log('[SignIn] Start:', { userId: user?.id, accountProvider: account?.provider });

            if (account?.provider === "credentials") {
                console.log('[SignIn Credentials] Allowing sign-in for user:', user?.id);
                return true; // Allow sign-in
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


                    console.log(`[SignIn OAuth] User processed. DB ID assigned: ${user.id}. Provider: ${account.provider}`);
                    return true;

                } catch (error) {
                    console.error("[SignIn OAuth] Error during fetchOrCreateUser:", error);
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
        async jwt({ token, user, account, profile, trigger, session }) {


            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
            }

            if (trigger === "update" && token.id) {
                console.log('user', user);
                console.log('account', account);
                console.log('profile', profile);
                console.log('trigger', trigger);
                console.log('session', session);
                try {
                    const dbUser = await db.user.findUnique({
                        where: { id: token.id },
                        select: { name: true, email: true, image: true }
                    });
                    console.log("DBUSER", dbUser);
                    if (dbUser) {
                        token.name = dbUser.name;
                        token.email = dbUser.email;
                        token.picture = dbUser.image;
                    } else {
                        console.error(`[JWT Update] User ID ${token.id} not found in DB.`);
                    }
                } catch (error) {
                    console.error(`[JWT Update] Error fetching user from DB for ID ${token.id}:`, error);
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
                console.error("[Session Callback] Token or token.id missing. Session user might be incomplete.");
                session.user = { ...session.user, id: undefined, name: null, email: null, image: null };
            }
            return session;
        },
    },
};

