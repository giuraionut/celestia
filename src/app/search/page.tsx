import { ftsPosts } from '@/actions/postActions';
import { HolyGrail, Left, Middle, Right } from '../components/shared/HolyGrail';
import { getSessionUserId } from '@/actions/actionUtils';
import PostList from '../components/post/PostList';

const SearchPage = async ({
  searchParams,
}: {
  searchParams: { q?: string; cursor?: string };
}) => {
  const { q, cursor } = await searchParams;

  // Fetch posts with a fallback to an empty array in case of error
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
            {/* Display Search Results */}
            <PostList key={postListKey} posts={posts} userId={userId} compact={true}/>
            {/* Load More */}
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
      <Right>
        <div className='w-full h-32 rounded border m-4 sticky top-14 p-4 bg-red-300'>
          Something{' '}
          {userId}
        </div>
      </Right>
    </HolyGrail>
  );
};

export default SearchPage;
