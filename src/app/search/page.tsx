import { ftsPosts } from '@/actions/postActions';
import { SearchBox } from '../components/client/SearchBox';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; cursor?: string };
}) {
  const { q, cursor } = await searchParams;
  // If you support cursor pagination, you might also pass searchParams.cursor to ftsPosts.
  const { posts, nextCursor } = (q &&
    (await ftsPosts(
      q,
      10,
      ['<span class="text-red-500">', '</span>'],
      cursor
    ))) || { posts: [] };

  console.log(posts);
  return (
    <div className='p-6 max-w-[700px] mx-auto'>
      <div className='flex flex-col gap-4'>
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id}>{post.title && <h2>{post.title}</h2>}</div>
          ))
        ) : (
          <p>No posts found for "{q}".</p>
        )}
      </div>
      {nextCursor && (
        <div className='mt-6 text-center'>
          {/* You can either link to the next page or implement infinite scroll */}
          <a
            href={`/search?q=${q}&cursor=${nextCursor}`}
            className='inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
          >
            Load More
          </a>
        </div>
      )}
        <SearchBox />
    </div>
  );
}
