'use server'

import { Post, ExtendedComment, ExtendedPost, VoteType } from "@prisma/client"
import { handleServerError, requireSessionUserId } from "./actionUtils"
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
        if (!userId) return null;
        post.authorId = userId;
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


// Type definitions
export interface ReadPostsParams {
    communityId?: string;
    cursor?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

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

        if (['createdAt', 'title', 'updatedAt'].includes(sortBy)) {
            orderBy[sortBy] = sortOrder;
        }
        else if (sortBy === 'voteCount') {
            orderBy = [
                {
                    voteScore: sortOrder,
                },
                { createdAt: 'desc' },
            ];
        }
        else if (sortBy === 'totalComments') {
            orderBy = [
                {
                    comments: {
                        _count: sortOrder,
                    },
                },
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


export interface ReadPostsByUserIdParams {
    userId: string;
    cursor?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const readPostsByUserId = async ({
    userId,
    cursor,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'asc'
}: ReadPostsByUserIdParams): Promise<{ posts: ExtendedPost[]; nextCursor?: string } | null> => {
    'use cache';
    cacheTag(`posts-${userId}`);

    try {
        // Debug the incoming sort parameters
        console.log(`Sorting request: ${sortBy} - ${sortOrder}`);

        let queryOptions: any = {
            where: { authorId: userId },
            include: {
                author: true,
                votes: true,
                comments: true,
                community: true,
            },
            take: limit + 1,
        };

        // Handle cursor pagination properly
        if (cursor) {
            queryOptions.cursor = { id: cursor };
            queryOptions.skip = 1; // Skip the cursor item
        }

        // Set up ordering based on the sort type
        if (['createdAt', 'title', 'updatedAt'].includes(sortBy)) {
            // Simple field sorting
            queryOptions.orderBy = { [sortBy]: sortOrder };
        }
        else if (sortBy === 'voteCount') {
            // Order by the stored voteScore field instead of counting votes.
            queryOptions.orderBy = { voteScore: sortOrder };
        }
        else if (sortBy === 'totalComments') {
            // Order by the stored totalComments field.
            queryOptions.orderBy = { totalComments: sortOrder };
        }
        else {
            // Default fallback
            queryOptions.orderBy = { createdAt: 'desc' };
        }

        // Debug the final query structure
        console.log('Final query structure:', JSON.stringify(queryOptions, null, 2));

        const posts = await db.post.findMany(queryOptions);

        posts.map(post => cacheTag(`post-${post.id}`));

        // Only set nextCursor if we actually have more items than the limit
        const hasMore = posts.length > limit;
        const nextCursor = hasMore ? posts[limit - 1].id : undefined;

        // Return posts up to the limit (or all if less than limit)
        return {
            posts: posts.slice(0, limit),
            nextCursor: hasMore ? nextCursor : undefined
        };
    } catch (error) {
        console.error('Prisma error:', error);
        handleServerError(error, 'reading posts by user.');
        return null;
    }
};




// Updates either totalUpvotes or totalDownvotes based on vote type and action.
export async function updatePostVoteCounts(
    postId: string,
    type: VoteType,
    action: 'increment' | 'decrement'
): Promise<void> {
    const updateData =
        type === VoteType.UPVOTE
            ? { totalUpvotes: { [action]: 1 } }
            : { totalDownvotes: { [action]: 1 } };

    await db.post.update({
        where: { id: postId },
        data: updateData,
    });
}

// Recalculates and updates the voteScore (totalUpvotes - totalDownvotes) for a given post.
export async function updatePostVoteScore(postId: string): Promise<void> {
    // Fetch current vote counts.
    const post = await db.post.findUnique({
        where: { id: postId },
        select: { totalUpvotes: true, totalDownvotes: true },
    });
    if (!post) return;
    const newScore = post.totalUpvotes - post.totalDownvotes;

    await db.post.update({
        where: { id: postId },
        data: { voteScore: newScore },
    });
}


// export const updatePostVotes = async (postId: string, voteType: VoteType): Promise<ExtendedPost | null> => {
//     try {

//         const totalUpvotes = await getTotalPostUpvotes(postId);
//         const totalDownVotes = await getTotalPostDownvotes(postId);

//         const res = await db.post.update({
//             where: { id: postId },
//             data: { totalDownvotes: totalDownVotes, totalUpvotes: totalUpvotes },
//             include: {
//                 author: true,
//                 votes: true
//             }
//         });
//         revalidateTag(`post-${postId}`);
//         return res;
//     }
//     catch (error) {
//         handleServerError(error, 'updating post vote.');
//         return null;
//     }
// }

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



