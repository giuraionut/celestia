'use server';

import { BannedUserFromCommunity, Community, ExtendedCommunity, RemovedPostFromCommunity, User } from "@prisma/client";
import { getSessionUserId, handleServerError, requireSessionUserId } from "./actionUtils";
import db from "@/lib/db";
import { updateTag } from "next/cache";
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
        updateTag("communities");
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


export async function banUser(communityId: string, userIdToBan: string): Promise<BannedUserFromCommunity | null> {
    try {
        const currentUserId = await requireSessionUserId("banning user from community");
        if (!currentUserId) return null;
        const community = await db.community.findUnique({
            where: { id: communityId },
            include: { managers: { select: { id: true } } }
        });
        if (!community) throw new Error("Community not found");

        const isManager = community.authorId === currentUserId || community.managers.some(m => m.id === currentUserId);
        if (!isManager) throw new Error("Not authorized");

        if (userIdToBan === currentUserId || userIdToBan === community.authorId) {
            throw new Error("Cannot ban this user");
        }

        const bannedUser = await db.bannedUserFromCommunity.create({
            data: {
                userId: userIdToBan,
                communityId: communityId,
                bannedById: currentUserId,
            }
        });
        updateTag(`community-${community.id}`)
        return bannedUser;
    }
    catch (error) {
        handleServerError(error, "banning user from community.");
        return null;
    }
}

export async function unbanUser(communityId: string, userIdToUnban: string): Promise<BannedUserFromCommunity | null> {
    try {
        const currentUserId = await requireSessionUserId("banning user from community");
        if (!currentUserId) return null;
        const unbannedUser = await db.bannedUserFromCommunity.delete({
            where: {
                userId_communityId: {
                    userId: userIdToUnban,
                    communityId: communityId
                }
            }
        });
        updateTag(`community-${communityId}`)
        return unbannedUser;
    }
    catch (error) {
        handleServerError(error, "banning user from community.");
        return null;
    }
}

export async function addManager(communityId: string, userIdToAdd: string): Promise<User | null> {
    try {
        const currentUserId = await requireSessionUserId("banning user from community");
        if (!currentUserId) return null;
        const community = await db.community.findUnique({
            where: { id: communityId },
            include: { managers: { select: { id: true } } }
        });
        if (!community) throw new Error("Community not found");

        const isManagerOrAuthor = community.authorId === currentUserId || community.managers.some(m => m.id === currentUserId);
        if (!isManagerOrAuthor) throw new Error("Not authorized");

        if (userIdToAdd === currentUserId || userIdToAdd === community.authorId) {
            throw new Error("Cannot add this user as manager");
        }

        const updatedCommunity = await db.community.update({
            where: { id: communityId },
            include: { managers: true },
            data: {
                managers: {
                    connect: { id: userIdToAdd }
                }
            }
        });
        updateTag(`community-${community.id}`)
        return updatedCommunity.managers.find((m) => m.id === userIdToAdd) || null;
    }
    catch (error) {
        handleServerError(error, "banning user from community.");
        return null;
    }
}

export async function removeManager(communityId: string, userIdToRemove: string): Promise<User | null> {
    try {
        const currentUserId = await requireSessionUserId("banning user from community");
        if (!currentUserId) return null;

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

        const updatedCommunity = await db.community.update({
            where: { id: communityId },
            include: { managers: true },

            data: {
                managers: {
                    disconnect: { id: userIdToRemove }
                }
            }
        });
        updateTag(`community-${community.id}`)
        return updatedCommunity.managers.find((m) => m.id === userIdToRemove) || null;
    }
    catch (error) {
        handleServerError(error, "banning user from community.");
        return null;

    }
}

export async function removePostFromCommunity(postId: string, communityId: string): Promise<RemovedPostFromCommunity | null> {
    try {
        const currentUserId = await requireSessionUserId("banning user from community");
        if (!currentUserId) return null;

        const post = await db.post.findUnique({ where: { id: postId } });
        if (!post || post.communityId !== communityId) {
            throw new Error("Post not found or does not belong to this community.");
        }

        const community = await db.community.findUnique({
            where: { id: communityId },
            select: { authorId: true, managers: { select: { id: true } } }
        });
        if (!community) throw new Error("Community not found");

        const isCommunityAdmin = community.authorId === currentUserId || community.managers.some(m => m.id === currentUserId);
        if (!isCommunityAdmin) throw new Error("Not authorized");

        const removedPost = await db.removedPostFromCommunity.upsert({
            where: { postId: postId },
            create: {
                postId: postId,
                communityId: communityId,
                removedById: currentUserId,
            },
            update: {
                removedAt: new Date(),
                removedById: currentUserId,
            }
        });
        updateTag(`community-${communityId}`)
        return removedPost;
    }
    catch (error) {
        handleServerError(error, "banning user from community.");
        return null;
    }
}

export async function restorePostToCommunity(postId: string, communityId: string): Promise<RemovedPostFromCommunity | null> {
    try {
        const currentUserId = await requireSessionUserId("banning user from community");
        if (!currentUserId) return null;

        const removedPost = await db.removedPostFromCommunity.delete({
            where: { postId: postId }
        });
        updateTag(`community-${communityId}`)
        return removedPost
    }
    catch (error) {
        handleServerError(error, "banning user from community.");
        return null;

    }

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
            include: {
                author: true, posts:
                    { include: { removedFromCommunity: true, author: true } }, managers: true, members: true, bannedUsers: true
            },
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
        updateTag(`community-${communityId}`);
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
        updateTag(`community-${communityId}`);
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

export const fetchVisitedCommunities = async () => {
    const userId = await requireSessionUserId("fetching visited communities");
    if (!userId) return [];
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


export const fetchUserCommunities = async () => {
    const userId = await requireSessionUserId("fetching visited communities");
    if (!userId) return [];
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


