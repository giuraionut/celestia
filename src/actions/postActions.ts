'use server'

import { Post, ExtendedComment, ExtendedPost } from "@prisma/client"
import { getSessionUserId, handleServerError, requireSessionUserId } from "./actionUtils"
import db from "@/lib/db";
import { fetchRepliesRecursively, readComment } from "./commentActions";
import { getTotalPostDownvotes, getTotalPostUpvotes } from "./voteUtils";
import { getSearchSuggestions, searchPosts } from "./postFTS";
import { PostSuggestion } from "@/types/types";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { revalidateTag } from "next/cache";

export const createPost = async (post: Post): Promise<Post | null> => {
    try {
        const userId = await requireSessionUserId('creating new post.');
        if(!userId) return null;
        delete (post as { id?: string }).id;
        return await db.post.create({ data: post });
    }
    catch (error) {
        handleServerError(error, 'creating new post.');
        return null;
    }
}
export const getPostTotalComments = async (postId: string): Promise<number> => {
    try {
        return await db.comment.count({ where: { postId } });
    } catch (error) {
        handleServerError(error, 'counting post comments.');
        return 0;
    }
};


export const updatePostTotalComments = async (postId: string): Promise<Post | null> => {
    try {

        const totalComments = await getPostTotalComments(postId);
        return await db.post.update({
            where: { id: postId },
            data: { totalComments: totalComments }
        });
    } catch (error) {
        handleServerError(error, 'updating post comments.');
        return null;
    }
};
export const readPost = async (id: string): Promise<ExtendedPost | null> => {
    'use cache'
    cacheTag(`post-${id}`);
    try {
        // await new Promise((resolve) => setTimeout(resolve, 20000));

        const post = await db.post.findUnique({
            where: { id },
            include: {
                author: true, // Include author details
                community: true, // Include community details
                comments: {
                    where: { parentId: null },
                    include: {
                        author: true, // Include author of each comment
                        votes: true, // Include votes for each comment
                        replies: true, // Include immediate replies
                    },
                },
                votes: true, // Include votes for the post
            },
        });

        if (!post) return null;

        const commentsWithDetails = await Promise.all(
            post.comments.map(async (comment: ExtendedComment) => {
                const detailedComment = await readComment(comment.id); // Fetch detailed comment with replies
                if (detailedComment) {
                    detailedComment.replies = await fetchRepliesRecursively(detailedComment.id);
                }
                return detailedComment;
            })
        );

        (post as unknown as ExtendedPost).comments = commentsWithDetails.filter(
            (comment: ExtendedComment | null): comment is ExtendedComment => comment !== null
        );

        return post;

    } catch (error) {
        handleServerError(error, 'reading post.');
        return null;
    }
};




export const readPosts = async ({
    communityId,
    cursor,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
}: ReadPostsParams = {}): Promise<{ posts: ExtendedPost[]; nextCursor?: string } | null> => {
    'use cache';
    cacheTag('posts');
    try {
        // Handle special sorting cases
        let orderBy: any = {};
        
        // Basic sorting for standard database fields
        if (['createdAt', 'title', 'updatedAt'].includes(sortBy)) {
            orderBy[sortBy] = sortOrder;
        }
        // Custom sorting for aggregated fields like vote count
        else if (sortBy === 'voteCount') {
            orderBy = [
                {
                    votes: {
                        _count: sortOrder,
                    },
                },
                // Secondary sort by creation date for stability
                { createdAt: 'desc' },
            ];
        }
        // Comment count sorting
        else if (sortBy === 'totalComments') {
            orderBy = [
                {
                    comments: {
                        _count: sortOrder,
                    },
                },
                // Secondary sort by creation date for stability
                { createdAt: 'desc' },
            ];
        }
        // Default fallback
        else {
            orderBy = { createdAt: 'desc' };
        }

        const posts = await db.post.findMany({
            where: communityId ? { communityId } : undefined,
            include: { 
                author: true, 
                votes: true, 
                comments: true, 
                community: true,
                _count: {
                    select: {
                        votes: true,
                        comments: true,
                    },
                },
            },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy,
        });
        
        posts?.forEach(post => cacheTag(`post-${post.id}`));

        // Determine the next cursor
        const nextCursor = posts.length > limit ? posts[limit].id : undefined;

        return { posts: posts.slice(0, limit), nextCursor };
    } catch (error) {
        handleServerError(error, 'reading posts.');
        return null;
    }
};

// Type definitions
export interface ReadPostsParams {
    communityId?: string;
    cursor?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export type ReadPostsByUserIdParams = {
    userId: string;
    cursor?: string;
    limit?: number;
}
export const readPostsByUserId = async ({ userId, cursor, limit = 20 }: ReadPostsByUserIdParams): Promise<{ posts: ExtendedPost[]; nextCursor?: string } | null> => {
    'use cache'
    cacheTag(`posts-${userId}`);
    try {
        const posts = await db.post.findMany({
            where: { authorId: userId },
            include: { author: true, votes: true, comments: true, community: true },
            take: limit + 1, // Fetch one extra to check if there's a next page
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), // Skip the cursor itself
            orderBy: { createdAt: 'asc' },
        });
        const nextCursor = posts.length > limit ? posts[limit].id : undefined;

        return { posts: posts.slice(0, limit), nextCursor };

    } catch (error) {
        handleServerError(error, 'reading posts.');
        return null;
    }
}

export const updatePostVotes = async (postId: string): Promise<ExtendedPost | null> => {
    try {

        const totalUpvotes = await getTotalPostUpvotes(postId);
        const totalDownVotes = await getTotalPostDownvotes(postId);

        const res = await db.post.update({
            where: { id: postId },
            data: { totalDownvotes: totalDownVotes, totalUpvotes: totalUpvotes },
            include: {
                author: true,
                votes: true
            }
        });
        revalidateTag(`post-${postId}`);
        return res;
    }
    catch (error) {
        handleServerError(error, 'updating post vote.');
        return null;
    }
}

export const ftsPosts = async (
    query: string,
    limit: number,
    highlightTags?: [string, string],
    cursor?: string
): Promise<{ posts: ExtendedPost[]; nextCursor?: string } | null> => {
    'use cache'
    cacheTag(`fts-posts-${query}`);
    try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const results = await searchPosts(query, limit, highlightTags, cursor);
        return results;
    } catch (error) {
        handleServerError(error, 'searching posts.');
        return null;
    }
};

export const searchSuggestionPosts = async (
    query: string,
    limit: number,
    snippetTags: [string, string]
): Promise<PostSuggestion[] | null> => {
    'use cache'
    try {
        const results = await getSearchSuggestions(query, limit, snippetTags);
        console.log('results', results);
        return results;
    } catch (error) {
        handleServerError(error, 'searching posts.');
        return null;
    }
};



