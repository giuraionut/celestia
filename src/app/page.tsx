import { readPosts } from '@/actions/postActions';
import PostList from './components/post/PostList';
import { HolyGrail, Left, Middle, Right } from './components/shared/HolyGrail';
import { loadMorePosts } from '@/actions/loadMoreActions';
import { getSessionUserId } from '@/actions/actionUtils';
import { SortProvider } from './components/post/PostSortingContext';
import { SortingControls } from './components/post/PostSortingControls';
import { getSortParams } from '@/lib/utils';
import LoadMore from './components/shared/LoadMore';

// Handle the search params to get the initial sort
interface HomeProps {
  searchParams?: Promise<{
    sort?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const { sort } = resolvedSearchParams || {};
  const initialSort = sort || 'newest';
  const userId = await getSessionUserId();

  // Get the sort parameters
  const sortParams = getSortParams(initialSort);

  // Initial load of posts with the correct sorting
  const postData = await readPosts({
    limit: 5,
    sortBy: sortParams.sortBy,
    sortOrder: sortParams.sortOrder,
  });

  const { posts: initialPosts = [], nextCursor: initialCursor } =
    postData || {};

  // Generate a unique key based on the sort option
  const postListKey = `post-list-${initialSort}`;
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <SortProvider
          initialSort={initialSort}
          showSortOptions={initialPosts.length > 0}
        >
          <div className='max-w-[700px] w-full items-center flex p-4'>
            <SortingControls />
          </div>
          <LoadMore
            loadMoreAction={loadMorePosts}
            initialCursor={initialCursor}
          >
            <PostList key={postListKey} posts={initialPosts} userId={userId} />
          </LoadMore>
        </SortProvider>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
}
// Helper function to get sort parameters
