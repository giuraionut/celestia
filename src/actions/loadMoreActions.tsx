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
      userId={actualUserId} // Fix: use actualUserId instead of userId
    />,
    nextCursor || null,
  ] as const;
}

// --- Define the type for items returned by readCommentsAndPostsByUserId ---
// Adjust this based on the EXACT structure returned by your Prisma query,
// including which relations are optional or always present.

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

  // Assuming readCommentsAndPostsByUserId returns { items: FetchedItem[], nextCursor: Date | null }
  const result = await readCommentsAndPostsByUserId({
    userId: actualUserId,
    cursor,
    limit: 5,
    sortBy,
    sortOrder,
  });

  if (!result || !result.items) return [null, null] as const;

  // Use the specific FetchedItem type here instead of 'any'
  const items: OverviewItem[] = result.items.map(
    (item: FetchedItem): OverviewItem => {
      // Use 'in' operator for structural checks (safer than just checking truthiness)
      // Add checks for essential differentiating properties
      if ('title' in item && 'communityId' in item) {
        // item is likely ExtendedPost-like structure
        // Cast to OverviewPost after adding/defaulting properties
        return {
          ...item, // Spread the original item
          type: 'post',
          // Provide defaults using nullish coalescing
          votes: item.votes ?? [],
          savedBy: item.savedBy ?? [],
          hiddenBy: item.hiddenBy ?? [],
          community: item.community ?? null,
          // Handle totalComments, prefer _count if available
          totalComments: item._count?.comments ?? item.totalComments ?? 0,
        } as OverviewPost; // Assert the final shape matches OverviewPost
      } else if ('postId' in item && 'content' in item) {
        // item is likely Comment-like structure
        // Cast to OverviewComment after adding/defaulting properties
        return {
          ...item, // Spread the original item
          type: 'comment',
          // Provide default for post relation
          post: item.post ?? null,
        } as OverviewComment; // Assert the final shape matches OverviewComment
      } else {
        // This block should ideally be unreachable if FetchedItem is accurate
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
