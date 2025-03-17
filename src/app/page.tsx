import { readPosts } from '@/actions/postActions';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import LoadMore from './components/post/LoadMorePosts';
import PostList from './components/post/PostList';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from './components/shared/HolyGrail';
import { loadMorePosts } from '@/actions/loadMoreActions';

export default async function Home() {
  // Initial load of posts
  const [session, postData] = await Promise.all([
    getServerSession(authOptions),
    readPosts({ limit: 5 }),
  ]);

  const userId = session?.user?.id;
  const { posts: initialPosts = [], nextCursor: initialCursor } =
    postData || {};

  return (
    <HolyGrail>
      <Left />
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
