'use server';

import { Vote, VoteType } from "@prisma/client";
import db from "@/lib/db";


export async function findVoteByUserAndTarget(targetId: string, userId: string, targetField: "postId" | "commentId"): Promise<Vote | null> {
    return await db.vote.findFirst({ where: { userId, [targetField]: targetId } });
}

export async function updateVote(voteId: string, value: VoteType): Promise<Vote> {
    return await db.vote.update({ where: { id: voteId }, data: { type: value } });
}

export async function createVote(targetId: string, userId: string, value: VoteType, targetField: "postId" | "commentId"): Promise<Vote> {
    return await db.vote.create({ data: { [targetField]: targetId, userId, type: value } });
}

export async function deleteVote(voteId: string): Promise<Vote> {
    return await db.vote.delete({ where: { id: voteId } });
}


export async function getPostVotes(targetIds: string[]): Promise<Vote[]> {
    return await db.vote.findMany({ where: { postId: { in: targetIds } } });
}

export async function getCommentVotes(targetIds: string[]): Promise<Vote[]> {
    return await db.vote.findMany({ where: { commentId: { in: targetIds } } });
}

export async function getTotalPostUpvotes(postId: string): Promise<number> {
    return await db.vote.count({ where: { postId, type: VoteType.UPVOTE } });
}
export async function getTotalPostDownvotes(postId: string): Promise<number> {
    return await db.vote.count({ where: { postId, type: VoteType.DOWNVOTE } });
}

export async function getTotalCommentUpvotes(commentId: string): Promise<number> {
    return await db.vote.count({ where: { commentId, type: VoteType.UPVOTE } });
}
export async function getTotalCommentDownvotes(commentId: string): Promise<number> {
    return await db.vote.count({ where: { commentId, type: VoteType.DOWNVOTE } });
}