'use server'

import { VoteType, Vote, ExtendedComment } from "@prisma/client";
import { getSessionUserId, handleServerError } from "./actionUtils";
import { readComment, readCommentsByPost, updateCommentVotes } from "./commentActions";
import { findVoteByUserAndTarget, updateVote, createVote, deleteVote } from "./voteUtils";

export async function voteOnComment(commentId: string, value: VoteType): Promise<Vote | null> {
    try {
        const userId = await getSessionUserId();
        const existingVote = await findVoteByUserAndTarget(commentId, userId, "commentId");
        const newVote = existingVote ? await updateVote(existingVote.id, value) : await createVote(commentId, userId, value, "commentId");
        await updateCommentVotes(commentId);

        return newVote
    } catch (error) {
        handleServerError(error, 'creating or updating comment vote');
        return null;
    }
}

export async function deleteCommentVote(commentId: string, voteId: string): Promise<Vote | false> {
    try {
        const deletedVote = await deleteVote(voteId);
        if (deletedVote.commentId) await updateCommentVotes(commentId);
        return deletedVote;
    } catch (error) {
        handleServerError(error, 'deleting comment vote');
        return false;
    }
}

export async function getUserVoteForComment(commentId: string): Promise<Vote | null> {
    'use cache'
    try {
        const userId = await getSessionUserId();
        return await findVoteByUserAndTarget(commentId, userId, "commentId");
    } catch (error) {
        handleServerError(error, 'retrieving user comment vote');
        return null;
    }
}

export async function getVotesForCommentsByPost(postId: string): Promise<Vote[]> {
    'use cache'
    try {
        const comments = await readCommentsByPost(postId);
        if (!comments) return [];

        const collectVotes = (comments: ExtendedComment[]): Vote[] =>
            comments.flatMap(comment => [
                ...(comment.votes || []),
                ...(comment.replies ? collectVotes(comment.replies) : [])
            ]);

        return collectVotes(comments);
    } catch (error) {
        handleServerError(error, 'retrieving votes for comments in post');
        return [];
    }
}

export async function getVotesForComment(commentId: string): Promise<Vote[]> {
    'use cache'
    try {
        const comments = [await readComment(commentId)].filter(comment => comment !== null) as ExtendedComment[];
        const collectVotes = (comments: ExtendedComment[]): Vote[] =>
            comments.flatMap(comment => [
                ...(comment.votes || []),
                ...(comment.replies ? collectVotes(comment.replies) : [])
            ]);

        return collectVotes(comments);
    } catch (error) {
        handleServerError(error, 'retrieving votes for comment');
        return [];
    }
}