import argon2 from "argon2";
import { AuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./db";

/**
 * Utility: Fetch or Create User and Account
 */
const fetchOrCreateUser = async (
    user: User,
    account: { provider: string; providerAccountId: string; id: string; type: string }
) => {
    const { email, name, image } = user;
    const { provider, providerAccountId, type } = account;

    if (!email) throw new Error("Email is required for OAuth");

    const providerStr = String(provider);
    const providerAccountIdStr = String(providerAccountId);

    // Find or create the user based on email
    let existingUser = await db.user.findUnique({ where: { email } });

    if (!existingUser) {
        // If user doesn't exist, create a new one
        existingUser = await db.user.create({
            data: {
                email,
                name: name || "",
                image: image || "",
            },
        });
    }

    // Check if the account already exists
    const existingAccount = await db.account.findFirst({
        where: {
            provider: providerStr,
            providerAccountId: providerAccountIdStr,
            userId: existingUser.id,
        },
    });

    if (!existingAccount) {
        // Create the account entry if it doesn't exist
        await db.account.create({
            data: {
                userId: existingUser.id,
                type,
                provider: providerStr,
                providerAccountId: providerAccountIdStr,
            },
        });
    }

    return existingUser;
};

export const authOptions: AuthOptions = {
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials || {};
                if (!email || !password) {
                    throw new Error("Email and password are required");
                }

                // Find user in the database
                const user = await db.user.findUnique({ where: { email } });
                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                // Verify password using argon2
                const isValid = await argon2.verify(user.password, password);
                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        /**
         * JWT Callback: Add user ID to the token
         */
        async jwt({ token, user, trigger, session }: { token: JWT; user?: User, trigger?: string, session?: Session }) {
            if (trigger === 'update' && session) {
                if (session.user.image) token.image = session.user.image;
                if (session.user.email) token.email = session.user.email;
                if (session.user.name) token.name = session.user.name;
                if (token.image) { token.image = session.user.image; }
                if (token.picture) { token.picture = session.user.image; }
            }
            if (user) token.id = String(user.id);
            return token;
        },

        /**
         * Session Callback: Add user ID to the session
         */
        async session({ session }: { session: Session }) {
            const email = session.user?.email;
            if (!email) {
                console.error("Session error: Missing email");
                return session;
            }

            const dbUser = await db.user.findUnique({ where: { email } });
            if (dbUser) {
                session.user.id = dbUser.id;
            } else {
                console.error("Session error: User not found in database");
            }

            return session;
        },

        /**
         * Sign-In Callback: Handle user and account creation
         */
        async signIn({ user, account,
            //  credentials
        }) {
            if (account?.provider === "credentials" && !user) {
                return false;
            }
            if (account) {
                try {
                    await fetchOrCreateUser(user, {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                        id: String(account.id),
                        type: account.type || "oauth",
                    });
                } catch (error) {
                    console.error("Sign-In error:", error);
                    return false;
                }
            }
            return true;
        },
    },
};
