'use server'

import { Community, ExtendedCommunity } from "@prisma/client"
import { getSessionUserId, handleServerError } from "./actionUtils"
import db from "@/lib/db";
import { revalidateTag } from "next/cache";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

export const createCommunity = async (community: Community): Promise<ExtendedCommunity | null> => {
    try {
        const userId = await getSessionUserId();
        community.authorId = userId;
        delete (community as { id?: string }).id;
        return await db.community.create({ data: community, include: { author: true, posts: true } });
    }
    catch (error) {
        handleServerError(error, 'creating new community.');
        return null;
    }
}

export const readCommunityById = async (id: string): Promise<ExtendedCommunity | null> => {
    'use cache'
    try {
        return await db.community.findUnique({
            where: { id },
            include:
            {
                author: true, posts:
                {
                    include:
                    {
                        author: true,
                    }
                }
            }
        });
    }
    catch (error) {
        handleServerError(error, 'reading community by id.');
        return null;
    }
}
export const readCommunityByName = async (name: string): Promise<ExtendedCommunity | null> => {
    'use cache'
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
        handleServerError(error, 'reading community by name.');
        return null;
    }
}

export const findCommunityByName = async (name: string): Promise<ExtendedCommunity[] | null> => {
    'use cache'
    name = name.toLowerCase().trim();
    try {
        const communities = await db.community.findMany({
            where: {
                name: {
                    contains: name,
                },
            },
            include: { author: true, posts: true }
        })
        return communities;
    }
    catch (error) {
        handleServerError(error, 'reading community by name.');
        return null;
    }
}

export const readCommunities = async (): Promise<ExtendedCommunity[] | null> => {
    'use cache'
    try {
        return await db.community.findMany({ include: { author: true, posts: true } });
    }
    catch (error) {
        handleServerError(error, 'reading communities.');
        return null;
    }
}

export const deleteCommunity = async (id: string): Promise<Community | null> => {
    try {
        return await db.community.delete({ where: { id } });
    }
    catch (error) {
        handleServerError(error, 'deleting community.');
        return null;
    }
}

export const joinCommunity = async (
    communityId: string
): Promise<ExtendedCommunity | null> => {
    try {
        const userId = await getSessionUserId();
        // Update the community: connect the current user and increment totalMembers.
        const res = await db.community.update({
            where: { id: communityId },
            data: {
                members: {
                    connect: { id: userId },
                },
                totalMembers: { increment: 1 },
            },
            include: { author: true, posts: true },
        });
        revalidateTag(`community-${communityId}`)
        return res;
    } catch (error) {
        handleServerError(error, 'joining community.');
        return null;
    }
};

export const leaveCommunity = async (
    communityId: string
): Promise<ExtendedCommunity | null> => {
    try {
        const userId = await getSessionUserId();
        // Update the community: connect the current user and increment totalMembers.
        const res = await db.community.update({
            where: { id: communityId },
            data: {
                members: {
                    disconnect: { id: userId },
                },
                totalMembers: { decrement: 1 },
            },
            include: { author: true, posts: true },
        });
        revalidateTag(`community-${communityId}`)
        return res;
    } catch (error) {
        handleServerError(error, 'leaving community.');
        return null;
    }
};

export const isUserMemberOfCommunity = async (
    communityId: string,
    userId?: string
): Promise<boolean> => {
    try {
        if (!userId) userId = await getSessionUserId();
        const community = await db.community.findFirst({
            where: {
                id: communityId,
                members: {
                    some: { id: userId },
                },
            },
            select: { id: true }, // Only fetch the id, nothing extra
        });
        return !!community;
    }
    catch (error) {
        handleServerError(error, 'checking if user is a member of the community.');
        return false;
    }

};

export const logCommunityVisit = async (userId: string, communityId: string) => {
    try {
        if (!userId || !communityId) return;

        await db.recentlyVisitedCommunity.upsert({
            where: { userId_communityId: { userId, communityId } },
            update: { visitedAt: new Date() },
            create: { userId, communityId },
        });
    }
    catch (error) {
        handleServerError(error, 'logging community visit.');
    }
};

export const fetchVisitedCommunities = async (userId: string) => {
    try {
        const ids = await db.recentlyVisitedCommunity.findMany({
            where: { userId },
            select: { communityId: true },
            orderBy: { visitedAt: 'desc' },
        });

        const communities = await db.community.findMany({
            where: { id: { in: ids.map((id) => id.communityId) } },
            include: { author: true, posts: true },
        });

        return communities;
    }
    catch (error) {
        handleServerError(error, 'fetching visited communities.');
        return [];
    }
}