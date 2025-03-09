import React from 'react';
import { readCommentsByPost } from '@/actions/commentActions';
import { readCommunityById } from '@/actions/communityActions';
import { readPost } from '@/actions/postActions';
import CommentsSection from '@/app/components/presentational/CommentsSection';
import CommunityCard from '@/app/components/presentational/CommunityCard';
import PostCard from '@/app/components/presentational/PostCard';

interface PostPageParams {
  params: { id: string; name: string };
}

const PostPage = async ({ params }: PostPageParams) => {
  const { id } = await params;

  // First, load the post (we need it to get the communityId)
  const post = await readPost(id);
  if (!post) {
    return <div>Post not found</div>;
  }
  // Load comments and community concurrently
  const [comments, community] = await Promise.all([
    readCommentsByPost(id),
    readCommunityById(post.communityId || ''),
  ]);

  return (
    <div className='flex flex-col md:flex-row h-full w-full'>
      {/* Left Sidebar (hidden on mobile) */}
      <aside className='hidden md:flex md:flex-[0.5]'>
        <div className='sticky top-0 w-full p-4'>
          {/* Placeholder for left sidebar content */}
          Column 1
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 border-l border-r'>
        <div className='max-w-3xl w-full mx-auto p-4 flex flex-col gap-4'>
          {community ? (
            <CommunityCard
              community={community}
              content={false}
              footer={false}
            />
          ) : (
            <div>Loading community...</div>
          )}
          {post ? <PostCard post={post} /> : <div>Loading post...</div>}
          {comments ? (
            <CommentsSection comments={comments} post={post} />
          ) : (
            <div>Loading comments...</div>
          )}
        </div>
      </main>

      {/* Right Sidebar (hidden on mobile) */}
      <aside className='hidden md:flex md:flex-[0.5]'>
        <div className='sticky top-0 w-full p-4'>
          {community ? (
            <CommunityCard
              community={community}
              className='border rounded-lg p-4'
            />
          ) : (
            <div>Loading community...</div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default PostPage;
