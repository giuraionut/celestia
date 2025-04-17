'use server';

import { Community, ExtendedCommunity } from "@prisma/client";
import { getSessionUserId, handleServerError, requireSessionUserId } from "./actionUtils";
import db from "@/lib/db";
import { revalidateTag } from "next/cache";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

/**
 * Helper: Returns the session user ID if logged in, or null if not.
 */

export const createCommunity = async (
    community: Community
): Promise<ExtendedCommunity | null> => {
    try {
        const userId = await requireSessionUserId("creating new community");
        if (!userId) return null;
        delete (community as { id?: string }).id;
        revalidateTag("communities");
        return await db.community.create({
            data: {
                ...community,
                authorId: userId,
                members: {
                    connect: { id: userId },
                },
                managers: {
                    connect: { id: userId },
                },
                totalMembers: 1,
                totalManagers: 1,
            },
            include: { author: true, posts: true, members: true, managers: true },
        });
    } catch (error) {
        handleServerError(error, "creating new community.");
        return null;
    }
};


// Example Server Action (needs error handling & auth)
export async function banUser(communityId: string, userIdToBan: string) {
    const currentUserId = await requireSessionUserId("banning user from community");
    if (!currentUserId) return;
    const community = await db.community.findUnique({
        where: { id: communityId },
        include: { managers: { select: { id: true } } }
    });
    if (!community) throw new Error("Community not found");

    const isManager = community.authorId === currentUserId || community.managers.some(m => m.id === currentUserId);
    if (!isManager) throw new Error("Not authorized");

    // Prevent banning self or author? (optional business logic)
    if (userIdToBan === currentUserId || userIdToBan === community.authorId) {
        throw new Error("Cannot ban this user");
    }

    await db.bannedUserFromCommunity.create({
        data: {
            userId: userIdToBan,
            communityId: communityId,
            bannedById: currentUserId, // Optional tracking
        }
    });
    revalidateTag(`community-${community.id}`)

    // Maybe disconnect from members:
    // await db.community.update({ where: { id: communityId }, data: { members: { disconnect: { id: userIdToBan } } } });
}

// Example Server Action (needs error handling & auth)
export async function unbanUser(communityId: string, userIdToUnban: string) {
    // ... Authorization check similar to banUser ...
    const currentUserId = await requireSessionUserId("banning user from community");
    if (!currentUserId) return;
    await db.bannedUserFromCommunity.delete({
        where: {
            userId_communityId: { // Use the @@unique constraint name
                userId: userIdToUnban,
                communityId: communityId
            }
        }
    });
    revalidateTag(`community-${communityId}`)

}

export async function addManager(communityId: string, userIdToAdd: string) {
    const currentUserId = await requireSessionUserId("banning user from community");
    if (!currentUserId) return;
    const community = await db.community.findUnique({
        where: { id: communityId },
        include: { managers: { select: { id: true } } }
    });
    if (!community) throw new Error("Community not found");

    const isManagerOrAuthor = community.authorId === currentUserId || community.managers.some(m => m.id === currentUserId);
    if (!isManagerOrAuthor) throw new Error("Not authorized");

    // Prevent adding self or author again (optional)
    if (userIdToAdd === currentUserId || userIdToAdd === community.authorId) {
        throw new Error("Cannot add this user as manager");
    }

    await db.community.update({
        where: { id: communityId },
        data: {
            managers: {
                connect: { id: userIdToAdd } // Connect the user to the managers relation
            }
        }
    });
    revalidateTag(`community-${community.id}`)
}

// Example Server Action (needs error handling & auth)
export async function removeManager(communityId: string, userIdToRemove: string) {
    const currentUserId = await requireSessionUserId("banning user from community");
    if (!currentUserId) return;
    const community = await db.community.findUnique({
        where: { id: communityId },
        include: { managers: { select: { id: true } } }
    });
    if (!community) throw new Error("Community not found");

    const isManagerOrAuthor = community.authorId === currentUserId || community.managers.some(m => m.id === currentUserId);
    if (!isManagerOrAuthor) throw new Error("Not authorized");

    // IMPORTANT: Prevent removing the original author
    if (userIdToRemove === community.authorId) {
        throw new Error("Cannot remove the community creator");
    }

    await db.community.update({
        where: { id: communityId },
        data: {
            managers: {
                disconnect: { id: userIdToRemove } // Disconnect the user
            }
        }
    });
    revalidateTag(`community-${community.id}`)

}

// Example Server Action (needs error handling & auth)
export async function removePostFromCommunity(postId: string, communityId: string) {
    // 1. Verify post exists and belongs to the community
    const currentUserId = await requireSessionUserId("banning user from community");
    if (!currentUserId) return;
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || post.communityId !== communityId) {
        throw new Error("Post not found or does not belong to this community.");
    }

    // 2. Authorization check (is currentUserId manager or author of the COMMUNITY)
    const community = await db.community.findUnique({
        where: { id: communityId },
        select: { authorId: true, managers: { select: { id: true } } }
    });
    if (!community) throw new Error("Community not found");

    const isCommunityAdmin = community.authorId === currentUserId || community.managers.some(m => m.id === currentUserId);
    if (!isCommunityAdmin) throw new Error("Not authorized");

    // 3. Create the removal record (use upsert to handle potential race conditions/retries)
    await db.removedPostFromCommunity.upsert({
        where: { postId: postId }, // Since postId is unique in this table
        create: {
            postId: postId,
            communityId: communityId,
            removedById: currentUserId,
        },
        update: { // If it somehow already exists, just update timestamp/remover
            removedAt: new Date(),
            removedById: currentUserId,
        }
    });
    revalidateTag(`community-${communityId}`)

}

// Example Server Action
export async function restorePostToCommunity(postId: string, communityId: string) {
    const currentUserId = await requireSessionUserId("banning user from community");
    if (!currentUserId) return;

    await db.removedPostFromCommunity.delete({
        where: { postId: postId }
    });
    revalidateTag(`community-${communityId}`)

}
export const readCommunityById = async (
    id: string
): Promise<ExtendedCommunity | null> => {
    "use cache";
    try {
        cacheTag(`community-${id}`)
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

export const findCommunitiesByName = async (
    name: string
): Promise<ExtendedCommunity[] | null> => {
    "use cache";
    name = name.toLowerCase().trim();
    try {
        const communities = await db.community.findMany({
            where: { name: { contains: name } },
            include: { author: true, posts: true },
        });
        communities.forEach(community => cacheTag(`community-${community.id}`));
        return communities;
    } catch (error) {
        handleServerError(error, "reading community by name.");
        return null;
    }
};
export const findCommunityByName = async (
    name: string
): Promise<ExtendedCommunity | null> => {
    "use cache";
    name = name.toLowerCase().trim();
    try {
        const community = await db.community.findFirst({
            where: { name: { contains: name } },
            include: { author: true, posts: true, managers: true, members: true, bannedUsers: true },
        });
        if (!community) return null;
        cacheTag(`community-${community.id}`);
        return community;
    } catch (error) {
        handleServerError(error, "reading community by name.");
        return null;
    }
};

export const readCommunities = async (): Promise<ExtendedCommunity[] | null> => {
    "use cache";
    cacheTag("communities");
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

export const isUserManagerOfCommunity = async (
    communityId: string,
    userId?: string
): Promise<boolean> => {
    const effectiveUserId = userId ?? await getSessionUserId();
    if (!effectiveUserId) return false;

    try {
        const community = await db.community.findFirst({
            where: {
                id: communityId,
                managers: { some: { id: effectiveUserId } },
            },
            select: { id: true },
        });
        return Boolean(community);
    } catch (error) {
        handleServerError(error, "checking if user is a manager of the community.");
        return false;
    }
};

export const canViewCommunity = async (
    communityId: string,
    userId?: string
): Promise<boolean> => {
    const effectiveUserId = userId ?? await getSessionUserId();
    if (!effectiveUserId) return false;

    try {
        const community = await db.community.findFirst({
            where: { id: communityId },
            select: { isPrivate: true },
        });
        if (community?.isPrivate && (!await isUserMemberOfCommunity(communityId, effectiveUserId) ||
            !await isUserManagerOfCommunity(communityId, effectiveUserId))) return false;
        return true;
    } catch (error) {
        handleServerError(error, "checking if user can view the community.");
        return false;
    }
}


export const logCommunityVisit = async (
    communityId: string,
    userId?: string
) => {
    try {
        const effectiveUserId = userId ?? await getSessionUserId();
        if (!effectiveUserId) return;
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
            where: { id: { in: ids.map(item => item.communityId) }, bannedUsers: { none: { userId } } },
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
            where: { members: { some: { id: userId } }, bannedUsers: { none: { userId } } },
            include: { author: true, posts: true },
        });
    } catch (error) {
        handleServerError(error, "fetching user communities.");
        return [];
    }
}


