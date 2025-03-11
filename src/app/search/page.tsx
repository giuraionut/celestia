import { ftsPosts } from '@/actions/postActions';
import { Suspense } from 'react';

type Post = {
  id: string;
  title: string;
  cover?: string;
  totalComments: number;
  totalUpvotes: number;
  totalDownvotes: number;
  community?: {
    name: string;
    image?: string;
  };
};

const PostListItem = ({ post }: { post: Post }) => {
  return (
    <div className='flex justify-between items-center h-30'>
      {/* Text content on the left */}
      <div className='flex-1 flex flex-col gap-2 justify-between h-full'>
        <div className='flex items-center'>
          {post.community?.image && (
            <img
              src={post.community.image}
              alt={post.community.name}
              className='w-6 h-6 rounded-full'
            />
          )}
          <span className='ml-2 text-sm text-primary'>
            {post.community?.name}
          </span>
        </div>
        <h2
          className='text-lg font-bold text-primary truncate'
          title={post.title}
        >
          {post.title}
        </h2>

        <div className='flex items-center text-sm text-gray-500 space-x-4 '>
          <span className='flex items-center gap-1'>{post.totalComments}</span>
          <span className='flex items-center gap-1'>
            {post.totalUpvotes - post.totalDownvotes}
          </span>
        </div>
      </div>
      {/* Cover image on the right */}
      {post.cover && (
        <div className='w-32 h-full flex-shrink-0'>
          <img
            src={post.cover}
            alt={post.title}
            className='w-full h-full object-cover rounded-md'
          />
        </div>
      )}
    </div>
  );
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; cursor?: string };
}) {
  const { q, cursor } = await searchParams;
  const { posts, nextCursor } = (q &&
    (await ftsPosts(
      q,
      10,
      ['<span class="text-red-500">', '</span>'],
      cursor
    ))) || { posts: [] };

  console.log(posts);
  return (
    <div className='p-6 max-w-screen-xl mx-auto'>
      <div className='flex flex-col gap-4'>
        {posts && posts.length > 0 ? (
          posts.map((post: Post) => <PostListItem key={post.id} post={post} />)
        ) : (
          <p className='py-4 text-center text-gray-500'>
            No posts found for "{q}".
          </p>
        )}
      </div>
      {nextCursor && (
        <div className='mt-6 text-center'>
          <a
            href={`/search?q=${q}&cursor=${nextCursor}`}
            className='inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
          >
            Load More
          </a>
        </div>
      )}
    </div>
  );
}
