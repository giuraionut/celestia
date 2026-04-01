'use server'

import { Vote, VoteType } from "@prisma/client";
import { handleServerError, requireSessionUserId } from "./actionUtils";
import { findVoteByUserAndTarget, updateVote, createVote, deleteVote, getPostVotes } from "./voteUtils";
import { updatePostVoteCounts, updatePostVoteScore } from "./postActions";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { updateTag } from "next/cache";

export async function voteOnPost(postId: string, value: VoteType): Promise<Vote | null> {
  try {
    const userId = await requireSessionUserId('voting on post');
    if (!userId) return null;

    const existingVote = await findVoteByUserAndTarget(postId, userId, "postId");

    if (existingVote) {
      await updateVote(existingVote.id, value);
      await updatePostVoteCounts(postId, existingVote.type, 'decrement');
      await updatePostVoteCounts(postId, value, 'increment');
      updateTag('posts');
      updateTag('fts-posts');
      updateTag(`post-${postId}`);
      await updatePostVoteScore(postId);
      return existingVote;
    } else {
      const newVote = await createVote(postId, userId, value, "postId");
      await updatePostVoteCounts(postId, value, 'increment');
      updateTag('posts');
      updateTag('fts-posts');
      updateTag(`post-${postId}`);
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
    const deletedVote = await deleteVote(voteId);
    if (deletedVote?.postId) {
      await updatePostVoteCounts(postId, deletedVote.type, 'decrement');
      updateTag('posts');
      updateTag(`post-${postId}`);
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
