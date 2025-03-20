'use server'

import { VoteType, Vote, ExtendedComment } from "@prisma/client";
import { handleServerError, requireSessionUserId } from "./actionUtils";
import { readComment, readCommentsByPost, updateCommentVoteCounts, updateCommentVotes, updateCommentVoteScore } from "./commentActions";
import { findVoteByUserAndTarget, updateVote, createVote, deleteVote } from "./voteUtils";
import { revalidateTag } from "next/cache";

export async function voteOnComment(commentId: string, value: VoteType): Promise<Vote | null> {
    try {
        const userId = await requireSessionUserId("voting on comment");
        if (!userId) return null;

        // Check if the user has already voted on this comment.
        const existingVote = await findVoteByUserAndTarget(commentId, userId, "commentId");

        if (existingVote) {
            // Switching vote type:
            // Update the vote record to reflect the new value.
            await updateVote(existingVote.id, value);
            // Decrement the count for the previous vote type.
            await updateCommentVoteCounts(commentId, existingVote.type, 'decrement');
            // Increment the count for the new vote type.
            await updateCommentVoteCounts(commentId, value, 'increment');
            // Revalidate the cache and update vote score.
            revalidateTag(`comment-${commentId}`);
            await updateCommentVoteScore(commentId);
            return existingVote; // Optionally, re-fetch and return updated vote data.
        } else {
            // No existing vote: create a new vote.
            const newVote = await createVote(commentId, userId, value, "commentId");
            await updateCommentVoteCounts(commentId, value, 'increment');
            revalidateTag(`comment-${commentId}`);
            await updateCommentVoteScore(commentId);
            return newVote;
        }
    } catch (error) {
        handleServerError(error, 'creating or updating comment vote');
        return null;
    }
}

export async function deleteCommentVote(commentId: string, voteId: string): Promise<Vote | false> {
    try {
        const deletedVote = await deleteVote(voteId);
        if (deletedVote?.commentId) {
            // Decrement the appropriate vote count.
            await updateCommentVoteCounts(commentId, deletedVote.type, 'decrement');
            revalidateTag(`comment-${commentId}`);
            await updateCommentVoteScore(commentId);
        }
        return deletedVote;
    } catch (error) {
        handleServerError(error, 'deleting comment vote');
        return false;
    }
}

export async function getUserVoteForComment(commentId: string): Promise<Vote | null> {
    try {
        const userId = await requireSessionUserId("creating or updating comment vote");
        if (!userId) return null;
        return await findVoteByUserAndTarget(commentId, userId, "commentId");
    } catch (error) {
        handleServerError(error, 'retrieving user comment vote');
        return null;
    }
}

export async function getVotesForCommentsByPost(postId: string): Promise<Vote[]> {
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