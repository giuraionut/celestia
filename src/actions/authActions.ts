'use server';

import db from "@/lib/db";
import { handleServerError, requireSessionUserId } from "./actionUtils";
import argon2 from "argon2";
import { User } from "@prisma/client";
export const createUser = async ({
    name,
    email,
    password,
}: {
    name: string;
    email: string;
    password: string;
}): Promise<{ success: boolean; message: string }> => {
    try {
        // Validate input
        if (!name || !email || !password) {
            throw new Error('All fields are required');
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, message: 'Email is already in use' };
        }

        // Hash password
        const hashedPassword = await argon2.hash(password);

        // Create the user
        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return { success: true, message: 'Account created successfully' };
    } catch (error: unknown) {
        handleServerError(error, 'creating a new user.');
        return { success: false, message: 'Internal server error' };
    }
};

/**
 * setPassword
 *
 * Sets or resets a user’s password.
 *
 * - If a password already exists on the account, the caller *must* supply
 *   `currentPassword`, and it will be verified before updating.
 * - If no password exists yet (e.g. OAuth‑only user), the caller may omit
 *   `currentPassword` to set an initial password.
 *
 * @param params.email            User’s email (lookup key)
 * @param params.currentPassword  The existing (plain) password — required if one is set
 * @param params.newPassword      The new (plain) password to hash & store
 * @returns                       `{ success: boolean; message: string }`
 */
export const setPassword = async ({
    email,
    currentPassword,
    newPassword,
  }: {
    email: string;
    currentPassword?: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      if (!email || !newPassword) {
        return { success: false, message: 'Email and new password are required.' };
      }
  
      // 1) Lookup the user
      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        return { success: false, message: 'User not found.' };
      }
  
      // 2) If they already have a password, require & verify it
      if (user.password) {
        if (!currentPassword) {
          return {
            success: false,
            message: 'Current password is required to set a new password.',
          };
        }
        const isMatch = await argon2.verify(user.password, currentPassword);
        if (!isMatch) {
          return { success: false, message: 'Current password is incorrect.' };
        }
      }
  
      // 3) Hash & store the new password
      const hashed = await argon2.hash(newPassword);
      await db.user.update({
        where: { email },
        data: { password: hashed },
      });
  
      return { success: true, message: 'Password updated successfully.' };
    } catch (err: unknown) {
      console.error('Error in setPassword:', err);
      return { success: false, message: 'Internal server error.' };
    }
  };
// Get connected providers for a user
export const getConnectedProviders = async ({
}: {
    }): Promise<{
        success: boolean;
        providers?: { provider: string; createdAt: Date }[];
        hasPassword?: boolean;
        message?: string;
    }> => {

    const userId = await requireSessionUserId('updating the user profile.');
    if (!userId) return { success: false, message: 'User not authenticated.' };

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) {
            return { success: false, message: 'User not found.' };
        }

        const accounts = await db.account.findMany({
            where: { userId },
            select: {
                provider: true,
                createdAt: true,
            },
        });

        return {
            success: true,
            providers: accounts,
            hasPassword: !!user.password,
        };
    } catch (error: unknown) {
        handleServerError(error, 'retrieving connected providers.');
        return { success: false, message: 'Internal server error.' };
    }
};

// Update user profile details
export const updateUserProfile = async ({
    name,
    email, image
}: {
    name?: string;
    email?: string;
    image?: string
}): Promise<{ success: boolean; message: string }> => {
    try {
        const userId = await requireSessionUserId('updating the user profile.');
        if (!userId) return { success: false, message: 'User not authenticated.' };

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                image
            },
        });
        
        if (!updatedUser) {
            return { success: false, message: 'Failed to update user profile.' };
        }
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error: unknown) {
        handleServerError(error, 'updating the user profile.');
        return { success: false, message: 'Internal server error.' };
    }
};


export const fetchUserProfileByName = async ({
    name }: { name: string }): Promise<User | null> => {
    try {
        const user = await db.user.findUnique({ where: { name: name } });
        return user;
    }
    catch (error: unknown) {
        handleServerError(error, 'updating the user profile.');
        return null;
    }
}

export const fetchAuthenticatedUser = async (): Promise<User | null> => {
    try {
        const id = await requireSessionUserId('updating the user profile.');
        if (!id) return null;
        const user = await db.user.findUnique({
            where: { id },
            include: {
                accounts: true

            }
        });
        return user;
    }
    catch (error: unknown) {
        handleServerError(error, 'updating the user profile.');
        return null;
    }
}

export const checkExistingPassword = async (): Promise<boolean> => {
    try {
        const userId = await requireSessionUserId('updating the user profile.');
        if (!userId) return false;
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { password: true }
        });
        return !!user?.password;
    }
    catch (error: unknown) {
        handleServerError(error, 'updating the user profile.');
        return false;
    }
}