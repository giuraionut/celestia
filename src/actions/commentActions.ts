'use server'
import db from "@/lib/db";
import { getSessionUserId, handleServerError } from "./actionUtils";
import { Comment, ExtendedComment } from "@prisma/client"
import { getTotalCommentDownvotes, getTotalCommentUpvotes } from "./voteUtils";
import { updatePostTotalComments } from "./postActions";
import { revalidateTag } from "next/cache";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

export const createComment = async (comment: Comment): Promise<ExtendedComment | null> => {
    try {
        const userId = await getSessionUserId();
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

        // await updatePostTotalComments(comment.postId);
        await db.post.update({ where: { id: comment.postId }, data: { totalComments: { increment: 1 } } });

        revalidateTag(`comments-${comment.postId}`)
        revalidateTag(`post-${comment.postId}`);
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

export type ReadCommentsByUserId = {
    userId: string,
    limit?: number,
    cursor?: string
}

export const readCommentsByUserId = async ({ userId, cursor, limit = 20 }: ReadCommentsByUserId): Promise<{ comments: ExtendedComment[]; nextCursor?: string } | null> => {
    'use cache'
    cacheTag(`comments-${userId}`);
    try {
        const comments = await db.comment.findMany({
            where: { authorId: userId },
            include: {
                author: true,
                votes: true,
                replies: true
            },
            take: limit + 1, // Fetch one extra to check if there's a next page
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), // Skip the cursor itself
            orderBy: { createdAt: 'asc' },
        });
        const nextCursor = comments.length > limit ? comments[limit].id : undefined;

        return { comments: comments.slice(0, limit), nextCursor };
    } catch (error) {
        handleServerError(error, 'reading comments by user');
        return null;
    }
}

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