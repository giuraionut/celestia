import React from 'react';
import { readCommentsByPost } from '@/actions/commentActions';
import {
  isUserMemberOfCommunity,
  readCommunityById,
} from '@/actions/communityActions';
import { readPost } from '@/actions/postActions';
import CommentsSection from '@/app/components/presentational/CommentsSection';
import CommunityCard from '@/app/components/presentational/CommunityCard';
import PostCard from '@/app/components/presentational/PostCard';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/presentational/HolyGrail';
import { AppSidebar } from '@/app/components/client/AppSidebar';

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
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const userVote = post.votes?.find((vote) => vote.userId === userId) || null;

  const isMemberOfCommunity = community
    ? await isUserMemberOfCommunity(community.id)
    : false;
  console.log('community', community);
  return (
    <HolyGrail>
      <Left />

      <Middle>
        <div className='max-w-3xl w-full p-4 flex flex-col gap-4'>
          {community ? (
            <CommunityCard
              isMemberOfCommunity={isMemberOfCommunity}
              community={community}
              content={false}
              footer={false}
            />
          ) : (
            <div>Loading community...</div>
          )}
          {post ? (
            <PostCard post={post} vote={userVote} className='max-h-[500px]' />
          ) : (
            <div>Loading post...</div>
          )}
          {comments ? (
            <CommentsSection comments={comments} post={post} />
          ) : (
            <div>Loading comments...</div>
          )}
        </div>
      </Middle>

      <Right>
        <div className='w-full h-fit m-4 sticky top-14'>
          {community ? (
            <CommunityCard
              isMemberOfCommunity={isMemberOfCommunity}
              community={community}
              className='border rounded-lg p-4 w-full h-full'
            />
          ) : (
            <div>Loading community...</div>
          )}
        </div>
      </Right>
    </HolyGrail>
  );
};

export default PostPage;
