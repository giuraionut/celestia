'use server';

import PostList from '@/app/components/post/PostList';
import { getSessionUserId } from './actionUtils';
import { readPosts, readPostsByUserId } from './postActions';
import { readCommentsByUserId } from './commentActions';
import CommentList from '@/app/components/comment/CommentList';
import { readCommentsAndPostsByUserId } from './postCommentActions';
import OverviewList from '@/app/components/shared/OverviewList';
import {
  FetchedItem,
  OverviewComment,
  OverviewItem,
  OverviewPost,
} from '@/types/types';

export async function loadMorePosts({
  cursor,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  communityId,
}: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  communityId?: string;
}) {
  const userId = await getSessionUserId();

  const result = await readPosts({
    communityId,
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
      userId={actualUserId}
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

  if (!result || !result.items) return [null, null] as const;

  const items: OverviewItem[] = result.items.map(
    (item: FetchedItem): OverviewItem => {
      if ('title' in item && 'communityId' in item) {
        return {
          ...item,
          type: 'post',
          votes: item.votes ?? [],
          savedBy: item.savedBy ?? [],
          hiddenBy: item.hiddenBy ?? [],
          community: item.community ?? null,
          totalComments: item._count?.comments ?? item.totalComments ?? 0,
        } as OverviewPost;
      } else if ('postId' in item && 'content' in item) {
        return {
          ...item,
          type: 'comment',
          post: item.post ?? null,
        } as OverviewComment;
      } else {
        console.error(
          'Unknown item structure in loadMoreUserPostsAndComments:',
          item
        );
        throw new Error(
          `Unknown item structure encountered: ${JSON.stringify(item)}`
        );
      }
    }
  );

  const nextCursorStr = result.nextCursor
    ? result.nextCursor.toISOString()
    : null;

  return [
    <OverviewList
      key={cursor || 'initial'}
      items={items}
      userId={actualUserId}
    />,
    nextCursorStr,
  ] as const;
};
