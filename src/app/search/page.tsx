import { ftsPosts } from '@/actions/postActions';
import { HolyGrail, Left, Middle, Right } from '../components/shared/HolyGrail';
import { getSessionUserId } from '@/actions/actionUtils';
import PostList from '../components/post/PostList';
import { Metadata } from 'next';
import { generateUserPageMetadata } from '@/lib/metadataUtils';
interface SearchPageProps {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}

export const metadata: Metadata = {
  title: 'Search | Celestia',
  description: 'See the latest posts and discussions.',
};
const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const { q, cursor } = await searchParams;

  const { posts, nextCursor } = (q &&
    (await ftsPosts(
      q,
      10,
      ['<span class="text-red-500">', '</span>'],
      cursor
    ))) || {
    posts: [],
  };

  const userId = await getSessionUserId();
  const postListKey = `post-list-${q}`;
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='p-6 w-full mx-auto flex-1 h-full'>
          <div className='flex flex-col gap-4'>
            <PostList key={postListKey} posts={posts} userId={userId} />
            {nextCursor && (
              <div className='mt-6 text-center'>
                <a
                  href={`/search?q=${q}&cursor=${nextCursor}`}
                  className='inline-block px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600'
                >
                  Load More
                </a>
              </div>
            )}
          </div>
        </div>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default SearchPage;
