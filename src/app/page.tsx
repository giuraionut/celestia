import { readPosts } from '@/actions/postActions';
import PostList from './components/post/PostList';
import { HolyGrail, Left, Middle, Right } from './components/shared/HolyGrail';
import { loadMorePosts } from '@/actions/loadMoreActions';
import { getSessionUserId } from '@/actions/actionUtils';
import { SortProvider } from './components/post/PostSortingContext';
import { SortingControls } from './components/post/PostSortingControls';
import { getSortParams } from '@/lib/utils';
import LoadMore from './components/shared/LoadMore';
import { Metadata } from 'next';
// Import Link for view switching (optional)
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // For optional view switch controls
import { LayoutGrid, List } from 'lucide-react'; // Icons for view switch controls
import EmptyContent from './components/shared/EmptyContent';

export const metadata: Metadata = {
  title: 'Celestia',
  description: 'See the latest posts and discussions.',
};

// Define allowed view types
type ViewMode = 'large' | 'compact';

interface HomeProps {
  searchParams?: {
    // Removed Promise wrapping for easier access in Server Components
    sort?: string;
    view?: string; // Add view parameter
  };
}

export default async function Home({ searchParams }: HomeProps) {
  // Directly use searchParams, Next.js handles the promise resolution for page props
  const { sort, view } = searchParams || {};
  const initialSort = sort || 'newest';
  const currentView: ViewMode = view === 'compact' ? 'compact' : 'large'; // Default to 'large'

  const userId = await getSessionUserId();
  const sortParams = getSortParams(initialSort);

  const postData = await readPosts({
    limit: 5,
    sortBy: sortParams.sortBy,
    sortOrder: sortParams.sortOrder,
  });

  const { posts: initialPosts = [], nextCursor: initialCursor } =
    postData || {};

  // Key can include view mode if needed, but sorting is usually enough
  const postListKey = `post-list-${initialSort}-${currentView}`;

  // Helper function to create links preserving other params
  const createViewLink = (newView: ViewMode) => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    params.set('view', newView);
    return `/?${params.toString()}`;
  };
  if (initialPosts.length === 0) {
    return <EmptyContent message='No posts found.' />;
  }

  return (
    <HolyGrail>
      <Left />
      <Middle>
        <SortProvider
          initialSort={initialSort}
          showSortOptions={initialPosts.length > 0}
        >
          <div className='max-w-[700px] w-full flex items-center justify-between p-4'>
            <SortingControls />

            <div className='flex items-center gap-2'>
              <Button
                variant={currentView === 'large' ? 'secondary' : 'ghost'}
                size='icon'
                asChild
              >
                <Link
                  href={createViewLink('large')}
                  aria-label='Switch to large view'
                >
                  <LayoutGrid className='h-5 w-5' />
                </Link>
              </Button>
              <Button
                variant={currentView === 'compact' ? 'secondary' : 'ghost'}
                size='icon'
                asChild
              >
                <Link
                  href={createViewLink('compact')}
                  aria-label='Switch to compact view'
                >
                  <List className='h-5 w-5' />
                </Link>
              </Button>
            </div>
          </div>

          <LoadMore
            loadMoreAction={loadMorePosts}
            initialCursor={initialCursor}
          >
            <PostList
              key={postListKey}
              posts={initialPosts}
              userId={userId}
              view={currentView}
            />
          </LoadMore>
        </SortProvider>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
}
