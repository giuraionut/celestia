// actions/postCommentActions.ts
'use server';
import { readPostsByUserId } from './postActions';
import { readCommentsByUserId } from './commentActions';

/**
 * Fetches both posts and comments for a user, merges them, and returns
 * a sorted, paginated list. For simplicity, this example assumes sorting
 * by 'createdAt'. In a production scenario, you might need a more robust
 * cursor-based approach.
 */
export async function readCommentsAndPostsByUserId({
  userId,
  cursor,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  userId: string;
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const cursorDate = cursor ? new Date(cursor) : null;

  const [postsResult, commentsResult] = await Promise.all([
    readPostsByUserId({ userId, limit: limit * 2, sortBy, sortOrder, cursor: undefined }),
    readCommentsByUserId({ userId, limit: limit * 2, sortBy, sortOrder, cursor: undefined }),
  ]);

  const posts = postsResult?.posts || [];
  const comments = commentsResult?.comments || [];

  const postsWithType = posts.map(item => ({ ...item, type: 'post' }));
  const commentsWithType = comments.map(item => ({ ...item, type: 'comment' }));

  const merged = [...postsWithType, ...commentsWithType].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  });

  const filtered = cursorDate
    ? merged.filter(item => {
        const itemDate = new Date(item.createdAt);
        return sortOrder === 'desc' ? itemDate < cursorDate : itemDate > cursorDate;
      })
    : merged;

  const paginatedItems = filtered.slice(0, limit);
  const nextCursor = paginatedItems.length === limit ? paginatedItems[paginatedItems.length - 1].createdAt : null;

  return { items: paginatedItems, nextCursor };
}
