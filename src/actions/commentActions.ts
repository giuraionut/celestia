'use server'
import db from "@/lib/db";
import { handleServerError, requireSessionUserId } from "./actionUtils";
import { Comment, ExtendedComment, Prisma, SavedComment, VoteType } from "@prisma/client"
import { getTotalCommentDownvotes, getTotalCommentUpvotes } from "./voteUtils";
import { revalidateTag } from "next/cache";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

export const createComment = async (comment: Comment): Promise<ExtendedComment | null> => {
    try {
        const userId = await requireSessionUserId("creating new comment.");
        if (!userId) return null;
        comment.authorId = userId;
        delete (comment as { id?: string }).id;
        const newComment = await db.comment.create({
            data: comment,
            include: {
                author: true,
                replies: true,
                votes: true
            },
        });

        await db.post.update({ where: { id: comment.postId }, data: { totalComments: { increment: 1 } } });

        revalidateTag(`comments-${comment.postId}`)
        revalidateTag(`post-${comment.postId}`);
        console.log("CREATED COMMENT", newComment);
        return newComment;
    }
    catch (error) {
        handleServerError(error, 'creating new comment.');
        return null;
    }
}

export const addReply = async (reply: Comment, parent: Comment): Promise<ExtendedComment | null> => {
    try {
        const newReply = await createComment(reply);
        revalidateTag(`replies-${parent.id}`)

        return newReply;
    }
    catch (error) {
        handleServerError(error, 'adding reply.');
        return null;
    }
}

export const updateComment = async (comment: Comment): Promise<ExtendedComment | null> => {
    try {
        const updatedComment: ExtendedComment = await db.comment.update({
            where: { id: comment.id }, data: comment, include: {
                author: true,
                replies: true,
                votes: true,
            },
        });
        updatedComment.replies = await fetchRepliesRecursively(updatedComment.id);
        revalidateTag(`comments-${comment.postId}`)
        revalidateTag(`replies-${comment.id}`);

        return updatedComment;
    }
    catch (error) {
        handleServerError(error, 'updating comment.');
        return null;
    }
}

export const readComment = async (commentId: string): Promise<ExtendedComment | null> => {
    'use cache'
    try {
        console.log(commentId);
        const parentComment = await db.comment.findFirst({
            where: { id: commentId },
            include: {
                author: true,
                votes: true,
                replies: true
            },
        });

        if (!parentComment) return null;

        // Fetch all replies recursively
        parentComment.replies = await fetchRepliesRecursively(parentComment.id);

        return parentComment;
    } catch (error) {
        handleServerError(error, 'reading comment');
        return null;
    }
};

export const saveComment = async (commentId: string): Promise<SavedComment | null> => {
    try {
        const userId = await requireSessionUserId("saving comment.");
        if (!userId) return null;
        const savedComment = await db.savedComment.create({
            data: {
                user: { connect: { id: userId } },
                comment: { connect: { id: commentId } },
            },
        })
        return savedComment;
    } catch (error) {
        handleServerError(error, 'saving comment.');
        return null;
    }
}


export const readCommentWithAncestors = async (
    commentId: string
): Promise<ExtendedComment | null> => {
    try {
        // Initialize the chain with the target comment.
        const chain: ExtendedComment[] = [];
        const currentComment = await db.comment.findUnique({
            where: { id: commentId }, include: {
                author: true,
                votes: true,
            }
        });
        if (!currentComment) {
            return null;
        }
        chain.push(currentComment);

        // Traverse up to the top-most ancestor.
        let currentParentId = currentComment.parentId;
        while (currentParentId) {
            const parentComment = await db.comment.findUnique({
                where: { id: currentParentId },
                include: {
                    author: true,
                    votes: true,
                }
            });
            if (!parentComment) {
                break;
            }
            chain.push(parentComment);
            currentParentId = parentComment.parentId;
        }

        // Now, chain[0] is the target comment and chain[last] is the top-most ancestor.
        // We need to set up the replies property for each parent to only include its direct child in this chain.
        // We iterate from the bottom of the chain (target comment) upward.
        for (let i = 0; i < chain.length - 1; i++) {
            // Since chain is built from target up to ancestor,
            // chain[i + 1] is the parent of chain[i].
            // Set the parent's replies to only contain the current child.
            chain[i + 1].replies = [chain[i]];
        }

        // Return the top-most ancestor.
        return chain[chain.length - 1];
    } catch (error) {
        handleServerError(error, 'reading comment last ancestor');
        return null;
    }
};


export const readCommentsByPost = async (
    postId: string
): Promise<ExtendedComment[] | null> => {
    'use cache'
    cacheTag(`comments-${postId}`);
    try {
        // Fetch the top-level comments for the post
        const topLevelComments = await db.comment.findMany({
            where: { postId, parentId: null },
            include: {
                author: true,
                votes: true,
            },
        });

        // Recursively fetch replies for each top-level comment
        const commentsWithReplies = await Promise.all(
            topLevelComments.map(async (comment: ExtendedComment) => {
                comment.replies = await fetchRepliesRecursively(comment.id);
                return comment;
            })
        );

        return commentsWithReplies;
    } catch (error) {
        handleServerError(error, 'reading comments by post');
        return null;
    }
};



export type FetchCommentsByPostProps = {
    postId: string;
    cursor?: string;
    limit?: number;
}
export const fetchCommentsByPost = async ({ postId, cursor, limit = 20 }: FetchCommentsByPostProps): Promise<{ comments: ExtendedComment[]; nextCursor?: string } | null> => {
    'use cache'
    cacheTag(`comments-${postId}`);
    try {
        // Fetch the top-level comments for the post
        const topLevelComments = await db.comment.findMany({
            where: { postId, parentId: null },
            include: {
                author: true,
                votes: true,
            },
            take: limit + 1, // Fetch one extra to check if there's a next page
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), // Skip the cursor itself
            orderBy: { createdAt: 'asc' },
        });

        // Recursively fetch replies for each top-level comment
        const commentsWithReplies = await Promise.all(
            topLevelComments.map(async (comment: ExtendedComment) => {
                cacheTag(`comment-${comment.id}`);
                comment.replies = await fetchRepliesRecursively(comment.id);
                return comment;
            })
        );
        const nextCursor = commentsWithReplies.length > limit ? commentsWithReplies[limit].id : undefined;

        return { comments: commentsWithReplies.slice(0, limit), nextCursor };
    } catch (error) {
        handleServerError(error, 'reading comments by post');
        return null;
    }
};

export interface ReadCommentsByUserId {
    userId: string;
    cursor?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const readCommentsByUserId = async ({
    userId,
    cursor,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'asc'
}: ReadCommentsByUserId): Promise<{ comments: ExtendedComment[]; nextCursor?: string } | null> => {
    'use cache';
    cacheTag(`comments-${userId}`);

    try {
        const queryOptions: Prisma.CommentFindManyArgs = {
            where: { authorId: userId },
            include: {
                author: true,
                votes: true,
                post: {
                    include: {
                        community: true,
                    },
                },
                savedBy: true,
            },
            take: limit + 1,
        };

        // Handle cursor pagination properly
        if (cursor) {
            queryOptions.cursor = { id: cursor };
            queryOptions.skip = 1; // Skip the cursor item
        }

        // Set up ordering based on the sort type
        if (['createdAt', 'updatedAt'].includes(sortBy)) {
            // Simple field sorting
            queryOptions.orderBy = { [sortBy]: sortOrder };
        }
        else if (sortBy === 'voteCount') {
            // Order by the stored voteScore field
            queryOptions.orderBy = { voteScore: sortOrder };
        }
        else {
            // Default fallback
            queryOptions.orderBy = { createdAt: 'desc' };
        }

        const comments = await db.comment.findMany(queryOptions);

        comments.map(comment => cacheTag(`comment-${comment.id}`));

        // Only set nextCursor if we actually have more items than the limit
        const hasMore = comments.length > limit;
        const nextCursor = hasMore ? comments[limit - 1].id : undefined;

        // Return comments up to the limit (or all if less than limit)
        return {
            comments: comments.slice(0, limit),
            nextCursor: hasMore ? nextCursor : undefined
        };
    } catch (error) {
        console.error('Prisma error:', error);
        handleServerError(error, 'reading comments by user.');
        return null;
    }
};



export const fetchRepliesRecursively = async (parentId: string): Promise<ExtendedComment[]> => {
    'use cache'
    cacheTag(`replies-${parentId}`);
    try {

        const replies = await db.comment.findMany({
            where: { parentId },
            include: {
                author: true,
                votes: true,
                replies: true, // Immediate replies
            },
        });

        // Recursively fetch replies for each reply
        return Promise.all(
            replies.map(async (reply) => {
                reply.replies = await fetchRepliesRecursively(reply.id); // Recursively fetch nested replies
                return reply;
            })
        );
    }
    catch (error) {
        handleServerError(error, 'fetching replies recursively.');
        return [];
    }
};


export const deleteComment = async (comment: ExtendedComment): Promise<ExtendedComment | null> => {
    try {
        const deleted = await db.comment.update({
            where: { id: comment.id },
            data: { isDeleted: true },
            include: {
                author: true,
                replies: true,
                votes: true
            },
        });

        await db.post.update({ where: { id: comment.postId }, data: { totalComments: { decrement: 1 } } });

        revalidateTag(`comments-${deleted.postId}`)
        revalidateTag(`replies-${deleted.id}`);
        revalidateTag(`post-${comment.postId}`);

        return deleted;
    }
    catch (error) {
        handleServerError(error, 'deleting comment');
        return null;
    }
}

export const updateCommentVotes = async (commentId: string): Promise<ExtendedComment | null> => {
    try {

        const totalUpvotes = await getTotalCommentUpvotes(commentId);
        const totalDownVotes = await getTotalCommentDownvotes(commentId);

        return await db.comment.update({
            where: { id: commentId },
            data: { totalDownvotes: totalDownVotes, totalUpvotes: totalUpvotes }
            , include: {
                author: true,
                replies: true,
                votes: true
            },
        });
    }
    catch (error) {
        handleServerError(error, 'updating post vote.');
        return null;
    }
}

export async function updateCommentVoteCounts(
    commentId: string,
    type: VoteType,
    action: 'increment' | 'decrement'
): Promise<void> {
    const updateData =
        type === VoteType.UPVOTE
            ? { totalUpvotes: { [action]: 1 } }
            : { totalDownvotes: { [action]: 1 } };

    await db.comment.update({
        where: { id: commentId },
        data: updateData,
    });
}

// Recalculates and updates the voteScore (totalUpvotes - totalDownvotes) for a comment.
export async function updateCommentVoteScore(commentId: string): Promise<void> {
    const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { totalUpvotes: true, totalDownvotes: true },
    });
    if (!comment) return;
    const newScore = comment.totalUpvotes - comment.totalDownvotes;
    await db.comment.update({
        where: { id: commentId },
        data: { voteScore: newScore },
    });
}