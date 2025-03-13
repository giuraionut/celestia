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
import PostCommentsCount from '@/app/components/comment/PostCommentsCount';
import { CommentsProvider } from '@/app/components/comment/CommentsCountContext';
import PostVote from '@/app/components/client/PostVote';

interface PostPageParams {
  params: { id: string; name: string };
}

const PostPage = async ({ params }: PostPageParams) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const post = await readPost(id);
  if (!post) {
    return <div>Post not found</div>;
  }
  const [comments, community] = await Promise.all([
    readCommentsByPost(id),
    readCommunityById(post.communityId),
  ]);

  const postVotes = post.votes || [];
  const userVote = postVotes.find((vote) => vote.userId === userId) || null;
  const totalComments = post.totalComments;

  const isMemberOfCommunity = community
    ? await isUserMemberOfCommunity(community.id)
    : false;

  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='max-w-[600px] flex flex-col gap-4 w-full'>
          {community && (
            <CommunityCard
              isMemberOfCommunity={isMemberOfCommunity}
              community={community}
              content={false}
              footer={false}
            />
          )}
          <PostCard post={post} />
          <CommentsProvider initialCount={totalComments}>
            <footer className='flex items-center justify-between'>
              <PostVote post={post} vote={userVote} />
              <PostCommentsCount />
            </footer>
            {comments && comments.length > 0 ? (
              <CommentsSection comments={comments} post={post} />
            ) : (
              <span>No comments found</span>
            )}
          </CommentsProvider>
        </div>
      </Middle>

      <Right>
        <div className='w-full h-fit m-4 sticky top-14'>
          {community && (
            <CommunityCard
              isMemberOfCommunity={isMemberOfCommunity}
              community={community}
              className='border rounded-lg p-4 w-full h-full'
            />
          )}
        </div>
      </Right>
    </HolyGrail>
  );
};

export default PostPage;
