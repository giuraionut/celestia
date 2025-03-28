'use server'

import { Vote, VoteType } from "@prisma/client";
import { handleServerError, requireSessionUserId } from "./actionUtils";
import { findVoteByUserAndTarget, updateVote, createVote, deleteVote, getPostVotes } from "./voteUtils";
import { updatePostVoteCounts, updatePostVoteScore } from "./postActions";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { revalidateTag } from "next/cache";

export async function voteOnPost(postId: string, value: VoteType): Promise<Vote | null> {
  try {
    const userId = await requireSessionUserId('voting on post');
    if (!userId) return null;

    const existingVote = await findVoteByUserAndTarget(postId, userId, "postId");

    if (existingVote) {
      // Switching vote type.
      await updateVote(existingVote.id, value);
      // Adjust vote counts: decrement previous type, then increment new type.
      await updatePostVoteCounts(postId, existingVote.type, 'decrement');
      await updatePostVoteCounts(postId, value, 'increment');
      // Revalidate and update score.
      revalidateTag('posts');
      revalidateTag('fts-posts');
      revalidateTag(`post-${postId}`);
      await updatePostVoteScore(postId);
      return existingVote;
    } else {
      // No vote exists: create a new vote.
      const newVote = await createVote(postId, userId, value, "postId");
      await updatePostVoteCounts(postId, value, 'increment');
      revalidateTag('posts');
      revalidateTag('fts-posts');
      revalidateTag(`post-${postId}`);
      await updatePostVoteScore(postId);
      return newVote;
    }
  } catch (error) {
    handleServerError(error, 'voting on post');
    return null;
  }
}

export async function deletePostVote(postId: string, voteId: string): Promise<Vote | null> {
  try {
    // Delete the vote.
    const deletedVote = await deleteVote(voteId);
    if (deletedVote?.postId) {
      // Decrement the appropriate vote count.
      await updatePostVoteCounts(postId, deletedVote.type, 'decrement');
      revalidateTag('posts');
      revalidateTag(`post-${postId}`);
      await updatePostVoteScore(postId);
    }
    return deletedVote;
  } catch (error) {
    handleServerError(error, 'deleting post vote');
    return null;
  }
}

export async function getUserVoteForPost(postId: string): Promise<Vote | null> {
  'use cache'
  cacheTag('userPostVote');

  try {
    const userId = await requireSessionUserId('retrieving user post vote');
    if (!userId) return null;
    return await findVoteByUserAndTarget(postId, userId, "postId");
  } catch (error) {
    handleServerError(error, 'retrieving user post vote');
    return null;
  }
}

export async function getVotesForPosts(postIds: string[]): Promise<Vote[]> {
  'use cache'
  cacheTag('postVotes');

  try {
    return await getPostVotes(postIds);
  } catch (error) {
    handleServerError(error, 'retrieving votes for posts');
    return [];
  }
}
