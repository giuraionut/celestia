'use server'

import { Post, ExtendedComment, ExtendedPost, VoteType, SavedPost, HiddenPost, User, Vote, Comment, Community, Prisma } from "@prisma/client"
import { handleServerError, requireSessionUserId } from "./actionUtils"
import db from "@/lib/db";
import { fetchRepliesRecursively, readComment } from "./commentActions";
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
        revalidateTag('posts');
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

export const isSaved = async (postId: string): Promise<boolean> => {
    try {
        const userId = await requireSessionUserId('checking if post is saved.');
        if (!userId) return false;
        return await db.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        }) !== null;
    } catch (error) {
        handleServerError(error, 'checking if post is saved.');
        return false;
    }
}

export const isHidden = async (postId: string): Promise<boolean> => {
    try {
        const userId = await requireSessionUserId('checking if post is hidden.');
        if (!userId) return false;
        return await db.hiddenPost.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        }) !== null;
    }
    catch (error) {
        handleServerError(error, 'checking if post is hidden.');
        return false;
    }
}


export const savePost = async (postId: string): Promise<SavedPost | null> => {
    try {
        const userId = await requireSessionUserId('saving post.');
        if (!userId) return null;

        revalidateTag(`post-${postId}`);
        revalidateTag(`saved-posts-${userId}`);
        revalidateTag(`posts`);

        // Create a new SavedPost record connecting the user and the post.
        return await db.savedPost.create({
            data: {
                user: { connect: { id: userId } },
                post: { connect: { id: postId } },
            },
        });
    } catch (error) {
        handleServerError(error, 'saving post.');
        return null;
    }
};

export const unsavePost = async (postId: string): Promise<SavedPost | null> => {
    try {
        const userId = await requireSessionUserId('unsaving post.');
        if (!userId) return null;
        revalidateTag(`post-${postId}`);
        revalidateTag(`saved-posts-${userId}`);
        revalidateTag(`posts`);

        return await db.savedPost.delete({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
    } catch (error) {
        handleServerError(error, 'unsaving post.');
        return null;
    }
}

export const hidePost = async (postId: string): Promise<HiddenPost | null> => {
    try {
        const userId = await requireSessionUserId('hiding post.');
        if (!userId) return null;
        revalidateTag(`post-${postId}`);
        revalidateTag(`hidden-posts-${userId}`);
        revalidateTag(`posts`);
        return await db.hiddenPost.create({
            data: {
                user: { connect: { id: userId } },
                post: { connect: { id: postId } },
            },
        });
    } catch (error) {
        handleServerError(error, 'hiding post.');
        return null;
    }
}

export const unhidePost = async (postId: string): Promise<HiddenPost | null> => {
    try {
        const userId = await requireSessionUserId('unhiding post.');
        if (!userId) return null;
        revalidateTag(`post-${postId}`);
        revalidateTag(`hidden-posts-${userId}`);
        revalidateTag(`posts`);
        return await db.hiddenPost.delete({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
    } catch (error) {
        handleServerError(error, 'unhiding post.');
        return null;
    }
}
export const readSavedPostsByUserId = async ({
    userId,
    cursor,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'asc',
}: ReadPostsByUserIdParams): Promise<{ posts: ExtendedPost[]; nextCursor?: string } | null> => {
    'use cache';
    cacheTag(`saved-posts-${userId}`);

    try {
        console.log(`Sorting request: ${sortBy} - ${sortOrder}`);

        const queryOptions: Prisma.SavedPostFindManyArgs = {
            where: { userId },
            include: {
                post: {
                    include: {
                        author: true,
                        votes: true,
                        comments: true,
                        community: true,
                        savedBy: true,
                        hiddenBy: true,
                    },
                },
            },
            take: limit + 1,
        };

        if (cursor) {
            queryOptions.cursor = { id: cursor };
            queryOptions.skip = 1;
        }

        if (['createdAt'].includes(sortBy)) {
            queryOptions.orderBy = { createdAt: sortOrder };
        } else {
            queryOptions.orderBy = { createdAt: 'desc' };
        }

        console.log('Final query structure:', JSON.stringify(queryOptions, null, 2));

        // Cast the result to a type that includes the "post" relation.
        const savedPosts = (await db.savedPost.findMany(queryOptions)) as Array<
            SavedPost & {
                post: Post & {
                    author: User;
                    votes: Vote[];
                    comments: Comment[];
                    community: Community;

                };
            }
        >;

        savedPosts.forEach((saved) => cacheTag(`post-${saved.post.id}`));

        const hasMore = savedPosts.length > limit;
        const nextCursor = hasMore ? savedPosts[limit - 1].id : undefined;

        // Map to the post itself
        const posts = savedPosts.slice(0, limit).map((saved) => saved.post);

        return {
            posts,
            nextCursor,
        };
    } catch (error) {
        console.error('Prisma error:', error);
        handleServerError(error, 'reading posts by user.');
        return null;
    }
};

export const readHiddenPostsByUserId = async ({
    userId,
    cursor,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'asc',
}: ReadPostsByUserIdParams): Promise<{ posts: ExtendedPost[]; nextCursor?: string } | null> => {
    'use cache';
    cacheTag(`hidden-posts-${userId}`);

    try {
        console.log(`Sorting request: ${sortBy} - ${sortOrder}`);

        const queryOptions: Prisma.HiddenPostFindManyArgs = {
            where: { userId },
            include: {
                post: {
                    include: {
                        author: true,
                        votes: true,
                        comments: true,
                        community: true,
                        hiddenBy: true,
                        savedBy: true
                    },
                },
            },
            take: limit + 1,
        };

        if (cursor) {
            queryOptions.cursor = { id: cursor };
            queryOptions.skip = 1;
        }

        if (['createdAt'].includes(sortBy)) {
            queryOptions.orderBy = { createdAt: sortOrder };
        } else {
            queryOptions.orderBy = { createdAt: 'desc' };
        }

        console.log('Final query structure:', JSON.stringify(queryOptions, null, 2));

        // Cast the result to a type that includes the "post" relation.
        const savedPosts = (await db.hiddenPost.findMany(queryOptions)) as Array<
            HiddenPost & {
                post: Post & {
                    author: User;
                    votes: Vote[];
                    comments: Comment[];
                    community: Community;
                };
            }
        >;

        savedPosts.forEach((saved) => cacheTag(`post-${saved.post.id}`));

        const hasMore = savedPosts.length > limit;
        const nextCursor = hasMore ? savedPosts[limit - 1].id : undefined;

        // Map to the post itself
        const posts = savedPosts.slice(0, limit).map((saved) => saved.post);

        return {
            posts,
            nextCursor,
        };
    } catch (error) {
        console.error('Prisma error:', error);
        handleServerError(error, 'reading posts by user.');
        return null;
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
                savedBy: true,
                hiddenBy: true,
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
        // Use the specific Prisma union type for orderBy
        let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];

        // Handle special sorting cases
        if (['createdAt', 'title', 'updatedAt'].includes(sortBy)) {
            // Ensure sortBy is a valid key recognized by Prisma for Post
            // TypeScript might need an assertion or a stricter type for sortBy
            // if it can't infer it's 'createdAt' | 'title' | 'updatedAt' here.
            // A simple approach for now:
            orderBy = { [sortBy]: sortOrder };
        }
        else if (sortBy === 'voteCount') {
            // Assumes 'voteScore' exists on your Post model
            orderBy = [
                {
                    voteScore: sortOrder,
                },
                { createdAt: 'desc' }, // Secondary sort
            ];
        }
        else if (sortBy === 'totalComments') {
            // Order by the count of related comments
            orderBy = [
                {
                    comments: {
                        _count: sortOrder,
                    },
                },
                { createdAt: 'desc' }, // Secondary sort
            ];
        }
        // Default fallback
        else {
            orderBy = { createdAt: 'desc' };
        }

        // No need to redefine the query options separately if only used once
        const posts = await db.post.findMany({
            where: communityId ? { communityId } : undefined,
            include: {
                author: true,
                votes: true,
                comments: true, // Consider using _count instead if you only need the count
                community: true,
                savedBy: true, // Might impact performance if large relations
                hiddenBy: true, // Might impact performance if large relations
                _count: {
                    select: {
                        // votes: true, // Use voteScore if pre-calculated
                        comments: true,
                    },
                },
            },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy, // Pass the correctly typed orderBy variable
        });

        // Optional Chaining in case posts is null/undefined (though findMany usually returns [])
        posts?.forEach(post => cacheTag(`post-${post.id}`));

        // Check length *before* slicing
        const hasMore = posts.length > limit;
        // Get the ID from the *last* item intended for the *next* page
        const nextCursor = hasMore ? posts[limit -1 ].id : undefined; // Correct index is limit - 1

        return {
            posts: posts.slice(0, limit), // Slice up to the limit
            nextCursor // Use the calculated nextCursor
        };
    } catch (error) {
        handleServerError(error, 'reading posts.');
        return null; // Return null on error as per function signature
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

        const queryOptions: Prisma.PostFindManyArgs = {
            where: { authorId: userId },
            include: {
                author: true,
                votes: true,
                comments: true,
                community: true,
                savedBy: true,
                hiddenBy: true,
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
    cacheTag(`fts-posts`);
    try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const results = await searchPosts(query, limit, highlightTags, cursor);
        results.posts.map(post => cacheTag(`post-${post.id}`));
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



