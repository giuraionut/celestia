import { readPosts } from '@/actions/postActions';
import LoadMore from './components/post/LoadMorePosts';
import PostList from './components/post/PostList';
import { HolyGrail, Left, Middle, Right } from './components/shared/HolyGrail';
import { loadMorePosts } from '@/actions/loadMoreActions';
import { getSessionUserId } from '@/actions/actionUtils';

export default async function Home() {
  // Initial load of posts
  const postData = await readPosts({ limit: 5 });

  const userId = await getSessionUserId();
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
