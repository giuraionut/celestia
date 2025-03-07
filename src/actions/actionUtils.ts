

import { authOptions } from "@/lib/auth";
import { format } from "date-fns";
import { getServerSession } from "next-auth";

export const getSessionUserId = async (): Promise<string> => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        console.error("Unauthorized: User is not authenticated");
        throw new Error("Unauthorized");
    }
    return session.user.id;
};

export const handleServerError = (error: unknown, context: string): never => {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Something went wrong while ${context}.`);
};

export const normalizeDate = (date: Date | string): Date => {
    const parsedDate = new Date(date);
    return new Date(format(parsedDate, "yyyy-MM-dd"));
};
