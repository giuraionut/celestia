'use server';

import { Community, ExtendedCommunity } from "@prisma/client";
import { getSessionUserId, handleServerError, requireSessionUserId } from "./actionUtils";
import db from "@/lib/db";
import { revalidateTag } from "next/cache";

/**
 * Helper: Returns the session user ID if logged in, or null if not.
 */

export const createCommunity = async (
    community: Community
): Promise<ExtendedCommunity | null> => {
    try {
        const userId = await requireSessionUserId("creating new community");
        if (!userId) return null;
        community.authorId = userId;
        // Let the database generate the ID.
        delete (community as { id?: string }).id;
        return await db.community.create({
            data: community,
            include: { author: true, posts: true },
        });
    } catch (error) {
        handleServerError(error, "creating new community.");
        return null;
    }
};

export const readCommunityById = async (
    id: string
): Promise<ExtendedCommunity | null> => {
    "use cache";
    try {
        return await db.community.findUnique({
            where: { id },
            include: {
                author: true,
                posts: { include: { author: true } },
            },
        });
    } catch (error) {
        handleServerError(error, "reading community by id.");
        return null;
    }
};

export const readCommunityByName = async (
    name: string
): Promise<ExtendedCommunity | null> => {
    "use cache";
    name = name.toLowerCase().trim();
    try {
        const result = await db.$queryRaw<Community[]>`
      SELECT * FROM Community 
      WHERE name COLLATE NOCASE = ${name}
      LIMIT 1
    `;
        if (!result.length) {
            return null;
        }
        const communityId = result[0].id;
        return readCommunityById(communityId);
    } catch (error) {
        handleServerError(error, "reading community by name.");
        return null;
    }
};

export const findCommunityByName = async (
    name: string
): Promise<ExtendedCommunity[] | null> => {
    "use cache";
    name = name.toLowerCase().trim();
    try {
        return await db.community.findMany({
            where: { name: { contains: name } },
            include: { author: true, posts: true },
        });
    } catch (error) {
        handleServerError(error, "reading community by name.");
        return null;
    }
};

export const readCommunities = async (): Promise<ExtendedCommunity[] | null> => {
    "use cache";
    try {
        return await db.community.findMany({
            include: { author: true, posts: true },
        });
    } catch (error) {
        handleServerError(error, "reading communities.");
        return null;
    }
};

export const deleteCommunity = async (
    id: string
): Promise<Community | null> => {
    try {
        const userId = await requireSessionUserId("deleting community");
        if (!userId) return null;
        // Optionally: check if userId === community.authorId here.
        return await db.community.delete({ where: { id } });
    } catch (error) {
        handleServerError(error, "deleting community.");
        return null;
    }
};

export const joinCommunity = async (
    communityId: string
): Promise<ExtendedCommunity | null> => {
    try {
        const userId = await requireSessionUserId("joining community");
        if (!userId) return null;
        const res = await db.community.update({
            where: { id: communityId },
            data: {
                members: { connect: { id: userId } },
                totalMembers: { increment: 1 },
            },
            include: { author: true, posts: true },
        });
        revalidateTag(`community-${communityId}`);
        return res;
    } catch (error) {
        handleServerError(error, "joining community.");
        throw null;
    }
};

export const leaveCommunity = async (
    communityId: string
): Promise<ExtendedCommunity | null> => {
    try {
        const userId = await requireSessionUserId("leaving community");
        if (!userId) return null;
        const res = await db.community.update({
            where: { id: communityId },
            data: {
                members: { disconnect: { id: userId } },
                totalMembers: { decrement: 1 },
            },
            include: { author: true, posts: true },
        });
        revalidateTag(`community-${communityId}`);
        return res;
    } catch (error) {
        handleServerError(error, "leaving community.");
        return null;
    }
};

export const isUserMemberOfCommunity = async (
    communityId: string,
    userId?: string
): Promise<boolean> => {
    // Use provided userId or fetch it; if not authenticated, return false.
    const effectiveUserId = userId ?? await getSessionUserId();
    if (!effectiveUserId) return false;

    try {
        const community = await db.community.findFirst({
            where: {
                id: communityId,
                members: { some: { id: effectiveUserId } },
            },
            select: { id: true },
        });
        return Boolean(community);
    } catch (error) {
        handleServerError(error, "checking if user is a member of the community.");
        return false;
    }
};




export const logCommunityVisit = async (
    communityId: string,
    userId?: string
) => {
    try {
        const effectiveUserId = userId ?? await getSessionUserId();
        if (!effectiveUserId) return; // Unauthenticated users do not log visits.
        await db.recentlyVisitedCommunity.upsert({
            where: { userId_communityId: { userId: effectiveUserId, communityId } },
            update: { visitedAt: new Date() },
            create: { userId: effectiveUserId, communityId },
        });
    } catch (error) {
        handleServerError(error, "logging community visit.");
    }
};

export const fetchVisitedCommunities = async (userId: string) => {
    try {
        const ids = await db.recentlyVisitedCommunity.findMany({
            where: { userId },
            select: { communityId: true },
            orderBy: { visitedAt: "desc" },
        });
        return await db.community.findMany({
            where: { id: { in: ids.map(item => item.communityId) } },
            include: { author: true, posts: true },
        });
    } catch (error) {
        handleServerError(error, "fetching visited communities.");
        return [];
    }
};


export const fetchUserCommunities = async (userId: string) => {
    try {
        return await db.community.findMany({
            where: { members: { some: { id: userId } } },
            include: { author: true, posts: true },
        });
    } catch (error) {
        handleServerError(error, "fetching user communities.");
        return [];
    }
}