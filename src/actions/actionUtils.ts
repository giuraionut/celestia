'use server'

import { authOptions } from "@/lib/auth";
import { format } from "date-fns";
import { getServerSession } from "next-auth";

export const getSessionUserId = async (): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
};
export const requireSessionUserId = async (context: string): Promise<string | null> => {
  const userId = await getSessionUserId();
  if (!userId) {
    console.warn(`User not authenticated for ${context}`);
    return null;
  }
  return userId;
};

export const handleServerError = async (error: unknown, context: string) => {
  console.error(`Error in ${context}:`, error);
  throw new Error(`Something went wrong while ${context}.`);
};

export const normalizeDate = async (date: Date | string) => {
  const parsedDate = new Date(date);
  return new Date(format(parsedDate, "yyyy-MM-dd"));
};
