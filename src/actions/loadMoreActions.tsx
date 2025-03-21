'use server';

import PostList from '@/app/components/post/PostList';
import { getSessionUserId } from './actionUtils';
import { readPosts, readPostsByUserId } from './postActions';
import { readCommentsByUserId } from './commentActions';
import CommentList from '@/app/components/comment/CommentList';
import { readCommentsAndPostsByUserId } from './postCommentActions';
import OverviewList from '@/app/components/shared/OverviewList';

export async function loadMorePosts({
  cursor,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) {
  const userId = await getSessionUserId();

  const result = await readPosts({
    cursor,
    limit: 5,
    sortBy,
    sortOrder,
  });

  if (!result) return [null, null] as const;

  const { posts, nextCursor } = result;

  return [
    <PostList key={cursor} posts={posts} userId={userId} />,
    nextCursor || null,
  ] as const;
}

export const loadMoreUserPosts = async ({
  cursor,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  userId, 
}: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  userId?: string; 
}) => {
  const actualUserId = userId || (await getSessionUserId());
  if (!actualUserId) throw new Error('User not found');

  const result = await readPostsByUserId({
    userId: actualUserId,
    cursor,
    limit: 5,
    sortBy,
    sortOrder,
  });

  if (!result) return [null, null] as const;
  const { posts, nextCursor } = result;

  return [
    <PostList key={cursor || 'initial'} posts={posts} userId={actualUserId} />,
    nextCursor || null,
  ] as const;
};


export async function loadMoreUserComments({
  cursor,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  userId, 
}: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  userId?: string;
}) {
  const actualUserId = userId || (await getSessionUserId());
  if (!actualUserId) throw new Error('User not found');

  const result = await readCommentsByUserId({
    userId: actualUserId,
    cursor,
    limit: 5,
    sortBy,
    sortOrder,
  });
  if (!result) return [null, null] as const;

  const { comments, nextCursor } = result;
  return [
    <CommentList
      key={cursor || 'initial'}
      comments={comments}
      userId={actualUserId} // Fix: use actualUserId instead of userId
    />,
    nextCursor || null,
  ] as const;
}






export const loadMoreUserPostsAndComments = async ({
  cursor,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  userId,
}: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  userId?: string;
}) => {
  const actualUserId = userId || (await getSessionUserId());
  if (!actualUserId) throw new Error('User not found');

  const result = await readCommentsAndPostsByUserId({
    userId: actualUserId,
    cursor,
    limit: 5,
    sortBy,
    sortOrder,
  });
  if (!result) return [null, null] as const;

  const { items, nextCursor } = result;

  // Convert nextCursor to a string if it's a Date (or ensure it's a string)
  const nextCursorStr = nextCursor ? new Date(nextCursor).toISOString() : null;

  return [
    <OverviewList key={cursor || 'initial'} items={items} userId={actualUserId} />,
    nextCursorStr,
  ] as const;
};
