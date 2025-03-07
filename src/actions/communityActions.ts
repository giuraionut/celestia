'use server'

import { Community, ExtendedCommunity } from "@prisma/client"
import { getSessionUserId, handleServerError } from "./actionUtils"
import db from "@/lib/db";

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
    'use cache'
    try {
        return await db.community.delete({ where: { id } });
    }
    catch (error) {
        handleServerError(error, 'deleting community.');
        return null;
    }
}