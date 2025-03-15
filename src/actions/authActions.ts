'use server';

import db from "@/lib/db";
import { handleServerError } from "./actionUtils";
import argon2 from "argon2";
import { unknown } from "zod";
import { User } from "@prisma/client";
// Create a new user
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

// Set a new password for a user
export const setPassword = async ({
    email,
    currentPassword,
    newPassword,
}: {
    email: string;
    currentPassword?: string; // Optional for setting a password
    newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
    try {
        if (!email || !newPassword) {
            throw new Error('Email and new password are required!');
        }

        // Find the user
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            return { success: false, message: 'User not found.' };
        }

        // If currentPassword is provided, verify it
        if (currentPassword) {
            const isMatch = await argon2.verify(currentPassword, user.password || '');
            if (!isMatch) {
                return { success: false, message: 'Current password is incorrect.' };
            }
        } else if (user.password) {
            // If currentPassword is not provided but a password exists, reject
            return { success: false, message: 'Current password is required to set a new password.' };
        }

        // Hash the new password
        const hashedPassword = await argon2.hash(newPassword);

        // Update user password
        await db.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        return { success: true, message: 'Password updated successfully.' };
    } catch (error: unknown) {
        handleServerError(error, 'retrieving connected providers.');
        return { success: false, message: 'Internal server error.' };
    }
};
// Get connected providers for a user
export const getConnectedProviders = async ({
    userId,
}: {
    userId: string;
}): Promise<{
    success: boolean;
    providers?: { provider: string; createdAt: Date }[];
    hasPassword?: boolean;
    message?: string;
}> => {
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
    userId,
    name,
    email,
}: {
    userId: string;
    name?: string;
    email?: string;
}): Promise<{ success: boolean; message: string }> => {
    try {
        if (!userId) {
            throw new Error('User ID is required.');
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                name,
                email,
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
