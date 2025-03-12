import { readPosts } from '@/actions/postActions';
import { ExtendedPost } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import LoadMore from './components/client/LoadMore';
import PostList from './components/client/PostList';
import { AppSidebar } from './components/client/AppSidebar';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from './components/presentational/HolyGrail';

// Define the number of posts to load per batch
const POSTS_PER_PAGE = 5;

// Server action to load more posts
// Server action to load more posts
async function loadMorePosts(cursor?: string) {
  'use server';
  console.log('LOAD MORE');

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const result = await readPosts({ cursor, limit: POSTS_PER_PAGE });
  const posts = result?.posts || [];
  const nextCursor = result?.nextCursor || null; // Convert undefined to null

  return [
    <PostList key={cursor || 'initial'} posts={posts} userId={userId} />,
    nextCursor,
  ] as const;
}

export default async function Home() {
  console.log('HOME');

  // Initial load of posts
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const result = await readPosts({ limit: POSTS_PER_PAGE });
  const initialPosts = result?.posts || [];
  const initialCursor = result?.nextCursor;

  return (
    <HolyGrail>
      <Left/>
      <Middle>
        <LoadMore loadMoreAction={loadMorePosts} initialCursor={initialCursor}>
          <PostList posts={initialPosts} userId={userId} />
        </LoadMore>
      </Middle>
      <Right>
        <div className='w-full h-32 rounded border m-4 sticky top-14 p-4 bg-red-300'>
          Something
        </div>
      </Right>
    </HolyGrail>
  );
}
