import { readPosts } from '@/actions/postActions';
import LoadMore from './components/post/LoadMorePosts';
import PostList from './components/post/PostList';
import { HolyGrail, Left, Middle, Right } from './components/shared/HolyGrail';
import { loadMorePosts } from '@/actions/loadMoreActions';
import { getSessionUserId } from '@/actions/actionUtils';
import { Suspense } from 'react';
import { SortProvider } from './components/post/PostSortingContext';
import { SortingControls } from './components/post/PostSortingControls';

// Handle the search params to get the initial sort
interface HomeProps {
  searchParams?: {
    sort?: string;
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const initialSort = searchParams?.sort || 'newest';
  
  // Get the sort parameters
  const sortParams = getSortParams(initialSort);
  
  // Initial load of posts with the correct sorting
  const postData = await readPosts({ 
    limit: 5,
    sortBy: sortParams.sortBy,
    sortOrder: sortParams.sortOrder
  });

  const userId = await getSessionUserId();
  const { posts: initialPosts = [], nextCursor: initialCursor } = postData || {};

  // Generate a unique key based on the sort option
  const postListKey = `post-list-${initialSort}`;
  return (
    <SortProvider initialSort={initialSort}>
      <HolyGrail>
        <Left />
        <Middle>
          <SortingControls />
        
            <LoadMore loadMoreAction={loadMorePosts} initialCursor={initialCursor}>
              <PostList key={postListKey} posts={initialPosts} userId={userId} />
            </LoadMore>
        </Middle>
        <Right>
          <div className='w-full h-32 rounded border m-4 sticky top-14 p-4 bg-red-300'>
            Something
          </div>
        </Right>
      </HolyGrail>
    </SortProvider>
  );
}
// Helper function to get sort parameters
function getSortParams(sortOption: string): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const sortMapping: { [key: string]: { sortBy: string; sortOrder: 'asc' | 'desc' } } = {
    newest: { sortBy: 'createdAt', sortOrder: 'desc' },
    oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
    mostVoted: { sortBy: 'voteCount', sortOrder: 'desc' },
    mostCommented: { sortBy: 'totalComments', sortOrder: 'desc' },
  };
  
  return sortMapping[sortOption as keyof typeof sortMapping] || sortMapping.newest;
}