'use server';

import PostList from '@/app/components/post/PostList';
import { getSessionUserId } from './actionUtils';
import { readPosts } from './postActions';

export async function loadMorePosts({
  cursor,
  sortBy = 'createdAt',
  sortOrder = 'desc'
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
    sortOrder
  });

  if (!result) return [null, null] as const;

  const { posts, nextCursor } = result;

  return [
    <PostList key={cursor} posts={posts} userId={userId} />,
    nextCursor || null,
  ] as const;
}