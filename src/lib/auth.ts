import argon2 from "argon2";
import { AuthOptions, User as NextAuthUser, Account as NextAuthAccount, Profile } from "next-auth"; // Import Profile type
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./db"; // Assuming './db' exports your Prisma Client instance
import { User as PrismaUser } from "@prisma/client";
// Import toast selectively if needed server-side (generally not recommended in auth logic)
// import { toast } from "sonner"; // Usually for client-side feedback

// --- Type Augmentation for JWT ---
declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        name?: string | null;
        email?: string | null;
        picture?: string | null;
        // Add any other custom fields you want in the token
    }
}

// --- Type Augmentation for Session User ---
// Add 'id' to the default session user type
declare module "next-auth" {
    interface Session {
        user: {
            id: string; // Add the id field
        } & NextAuthUser; // Keep existing fields (name, email, image)
    }
}


// --- Helper Types ---
// Use built-in types where possible, define specific ones if needed
type ProviderUserInfo = Pick<NextAuthUser, 'email' | 'name' | 'image'>;
// Define a more specific type for account info needed in fetchOrCreateUser
type ProviderAccountInfo = Pick<NextAuthAccount, 'provider' | 'providerAccountId' | 'type' | 'access_token' | 'refresh_token' | 'expires_at' | 'id_token' | 'scope' | 'session_state' | 'token_type'>;


// --- Database User/Account Handling ---
/**
 * Finds an existing user by email or creates a new one using provider details,
 * then ensures the specific OAuth provider account is linked to the user.
 * This operation is performed within a database transaction for atomicity.
 * User profile data (name, image) is only set on creation, not overwritten.
 *
 * @param userProfile - User profile data from the OAuth provider (must include email).
 * @param account - OAuth account details from NextAuth.
 * @returns The PrismaUser record (found or created).
 * @throws Error if email is missing or if the database transaction fails.
 */
const fetchOrCreateUser = async (
    userProfile: ProviderUserInfo,
    account: ProviderAccountInfo // Use the specific type
): Promise<PrismaUser> => {
    // Destructure with safety checks for potentially null profile values
    const email = userProfile.email;
    const providerName = userProfile.name;
    const providerImage = userProfile.image;
    const { provider, providerAccountId, type } = account;

    if (!email) {
        throw new Error(`Email is required for ${provider} sign-in.`);
    }
    try {
        const userInDb = await db.$transaction(async (tx) => {
            let localUser = await tx.user.findUnique({
                where: { email },
            });

            if (!localUser) {
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
                console.log(`[Auth] Found existing user for email: ${email}, ID: ${localUser.id}`);
            }
            if (!localUser) {
                throw new Error("Database error: Failed to find or create user.");
            }

            const userId = localUser.id;

            const existingAccount = await tx.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: provider,
                        providerAccountId: providerAccountId,
                    }
                },
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
            } else {
                await tx.account.update({ where: { id: existingAccount.id }, data: { access_token: account.access_token, refresh_token: account.refresh_token } });
            }

            return localUser;
        });

        console.log(`[Auth] fetchOrCreateUser completed successfully for email: ${email}`);
        return userInDb;

    } catch (error) {
        console.error("[Auth] Error in fetchOrCreateUser transaction:", error);
        throw new Error("Database operation failed during sign-in account handling.");
    }
};


export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            /**
             * authorize: Verifies credentials against your database.
             * MUST return the user object on success (without password) or null on failure.
             * Throwing an error here will also signify failure.
             */
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const { email, password } = credentials;

                try {
                    const user = await db.user.findUnique({ where: { email } });
                    if (!user || !user.password) {
                        console.log(`[Auth] Authorize failed: No user found or no password set for ${email}.`);
                        return null;
                    }

                    const isValid = await argon2.verify(user.password, password);

                    if (!isValid) {
                        console.log(`[Auth] Authorize failed: Invalid password for ${email}.`);
                        return null;
                    }

                    console.log(`[Auth] Authorize successful for ${email}.`);
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                    };
                } catch (error) {
                    console.error("[Auth] Error during credentials authorization:", error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        /**
         * signIn: Controls if a sign-in attempt should be allowed to proceed.
         * Runs AFTER successful OAuth or authorize().
         */
        async signIn({ user, account, profile }) {
            console.log(`[Auth] signIn callback invoked. Provider: ${account?.provider}, User ID from Auth: ${user?.id}`);

            if (account && profile && user && account.provider !== 'credentials') {
                console.log(`[Auth] signIn: Handling OAuth provider: ${account.provider}`);
                try {
                    const providerUserInfo: ProviderUserInfo = {
                        email: profile.email,
                        name: profile.name ?? user.name,
                        image: profile.image ?? user.image,
                    };

                    if (!providerUserInfo.email) {
                        console.error(`[Auth] signIn: OAuth profile for ${account.provider} missing email. Blocking sign-in.`);
                        return false;
                    }

                    const prismaUser = await fetchOrCreateUser(providerUserInfo, account);
                    user.id = prismaUser.id;
                    console.log(`[Auth] signIn: OAuth process success for ${user.email}, DB User ID: ${user.id}. Allowing sign-in.`);
                    return true;

                } catch (error) {
                    console.error("[Auth] signIn: Error during OAuth fetchOrCreateUser:", error);
                    return false;
                }
            }

            return !!user;

        },

        /**
         * jwt: Modifies the JWT before it's saved.
         * - Initial sign in: `user` object from `authorize` or OAuth is available.
         * - Subsequent requests: Only `token` is available initially.
         */
        async jwt({ token, user, account, profile, trigger, session }) {

            if (user?.id) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
            }

            if (trigger === "update" && session?.name && token.id) {
                console.log(`[Auth] jwt: Session update trigger received for user ID: ${token.id}`);
                try {
                    const dbUser = await db.user.findUnique({ where: { id: token.id }, select: { name: true, email: true, image: true } });
                    if (dbUser) {
                        console.log("[Auth] jwt: Updating token with fresh data from DB.");
                        token.name = dbUser.name;
                        token.email = dbUser.email;
                        token.picture = dbUser.image;
                    } else {
                        console.warn(`[Auth] jwt: User ${token.id} not found during session update.`);
                    }
                } catch (error) {
                    console.error(`[Auth] jwt: Error refetching user during session update for ${token.id}:`, error);
                }
            }

            return token;
        },

        /**
         * session: Creates the session object returned to the client.
         * Receives the potentially modified JWT (`token`).
         */
        async session({ session, token }) {

            if (token?.id) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
            } else {
                session.user = { ...session.user, id: '', name: null, email: null, image: null };
            }
            return session;
        },
    },
};

