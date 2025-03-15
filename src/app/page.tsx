import { readPosts } from '@/actions/postActions';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import LoadMore from './components/client/LoadMore';
import PostList from './components/client/PostList';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from './components/presentational/HolyGrail';
import {loadMorePosts } from '@/actions/loadMoreActions';



export default async function Home() {
  // Initial load of posts
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const result = await readPosts({ limit: 5 });
  const initialPosts = result?.posts || [];
  const initialCursor = result?.nextCursor;

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