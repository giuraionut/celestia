'use server'

import { Vote, VoteType } from "@prisma/client";
import { getSessionUserId, handleServerError } from "./actionUtils";
import { findVoteByUserAndTarget, updateVote, createVote, deleteVote, getPostVotes } from "./voteUtils";
import { updatePostVotes } from "./postActions";

export async function voteOnPost(postId: string, value: VoteType): Promise<Vote | null> {
    try {
        const userId = await getSessionUserId();
        const existingVote = await findVoteByUserAndTarget(postId, userId, "postId");

        const newVote = existingVote
            ? await updateVote(existingVote.id, value)
            : await createVote(postId, userId, value, "postId");

        await updatePostVotes(postId);

        return newVote;
    } catch (error) {
        handleServerError(error, 'creating or updating post vote');
        return null;
    }
}

export async function deletePostVote(postId: string, voteId: string): Promise<Vote | null> {
    try {
        const deletedVote = await deleteVote(voteId);
        if (deletedVote.postId) await updatePostVotes(postId);
        return deletedVote;
    } catch (error) {
        handleServerError(error, 'deleting post vote');
        return null;
    }
}

export async function getUserVoteForPost(postId: string): Promise<Vote | null> {
    'use cache'
    try {
        const userId = await getSessionUserId();
        return await findVoteByUserAndTarget(postId, userId, "postId");
    } catch (error) {
        handleServerError(error, 'retrieving user post vote');
        return null;
    }
}

export async function getVotesForPosts(postIds: string[]): Promise<Vote[]> {
    'use cache'
    try {
        return await getPostVotes(postIds);
    } catch (error) {
        handleServerError(error, 'retrieving votes for posts');
        return [];
    }
}
