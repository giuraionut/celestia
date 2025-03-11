import { readPosts } from '@/actions/postActions';
import { ExtendedPost } from '@prisma/client';
import Link from 'next/link';
import PostCard from './components/presentational/PostCard';

export default async function Home() {
  const result = await readPosts({ limit: 5 });
  const posts = result?.posts || [];
  const nextCursor = result?.nextCursor;
  console.log('HOME');
  return (
    <div className='flex flex-col md:flex-row h-screen w-full '>
      {/* Left Sidebar (hidden on mobile) */}
      <aside className='hidden md:flex md:flex-[0.5]'>
        <div className='text-center'>Something</div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 border-l border-r'>
        <div className='max-w-3xl w-full mx-auto p-4 flex flex-col gap-4'>
          {posts &&
            posts.map(
              (post: ExtendedPost) =>
                post.community && (
                  <Link
                    key={post.id}
                    href={`/community/${post.community.name}/post/${post.id}/comments`}
                  >
                    <PostCard post={post} className=' h-[500px]' />
                  </Link>
                )
            )}
        </div>
      </main>

      {/* Right Sidebar (hidden on mobile) */}
      <aside className='hidden md:flex md:flex-[0.5]'>
        <div className='sticky top-0 w-full p-4'>
          <div className='text-center'>Something</div>
        </div>
      </aside>
    </div>
  );
}
