// File: actions/loadMoreActions.ts
import { readPosts } from '@/actions/postActions';
import PostList from '@/app/components/post/PostList';
import { ReactNode } from 'react';
import { getSessionUserId } from './actionUtils';

export const POSTS_PER_PAGE = 5;

// Base function to fetch posts data (not a server action)
export async function fetchPosts(cursor?: string, communityId?: string) {

  const userId = await getSessionUserId();

  const result = await readPosts({ 
    cursor, 
    limit: POSTS_PER_PAGE,
    communityId // Only include communityId if provided
  });
  
  const posts = result?.posts || [];
  const nextCursor = result?.nextCursor || null; // Convert undefined to null

  return {
    posts,
    nextCursor,
    userId
  };
}

// Generic server action for loading more posts
export async function loadMorePosts(cursor?: string): Promise<[ReactNode, string | null]> {
  'use server';
  
  const { posts, nextCursor, userId } = await fetchPosts(cursor);
  
  return [
    <PostList key={cursor || 'initial'} posts={posts} userId={userId} />,
    nextCursor,
  ];
}