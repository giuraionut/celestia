'use server';

import PostList from '@/app/components/post/PostList';
import { getSessionUserId } from './actionUtils';
import { readPosts, readPostsByUserId } from './postActions';
import { readCommentsByUserId } from './commentActions';
import CommentList from '@/app/components/comment/CommentList';

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
}: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => {
  const userId = await getSessionUserId();

  if (!userId) throw new Error('User not found');

  // Debug log to verify sort parameters
  console.log('Loading more posts with:', {
    userId,
    cursor,
    sortBy,
    sortOrder,
  });

  const result = await readPostsByUserId({
    userId,
    cursor,
    limit: 5,
    sortBy,
    sortOrder,
  });

  if (!result) return [null, null] as const;

  const { posts, nextCursor } = result;

  return [
    <PostList key={cursor || 'initial'} posts={posts} userId={userId} />,
    nextCursor || null,
  ] as const;
};

export async function loadMoreUserComments({
  cursor,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('User not found');
  const result = await readCommentsByUserId({
    userId: userId,
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
      userId={userId}
    />,
    nextCursor || null,
  ] as const;
}
