import React from 'react';
import { fetchCommentsByPost } from '@/actions/commentActions';
import {
  isUserMemberOfCommunity,
  readCommunityById,
} from '@/actions/communityActions';
import { readPost } from '@/actions/postActions';
import CommunityCard from '@/app/components/community/CommunityCard';
import PostCard from '@/app/components/post/PostCard';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import PostCommentsCount from '@/app/components/comment/PostCommentsCount';
import PostVote from '@/app/components/post/PostVote';
import CommentsSection from '@/app/components/comment/CommentsSection';
import { ExtendedComment } from '@prisma/client';
import { CommentsProvider } from '@/app/components/comment/CommentsContext';
import { getSessionUserId } from '@/actions/actionUtils';
import LoadMorePostComments from '@/app/components/comment/LoadMorePostComments';

// This is now an SSR Server Component
const PostPage = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;
  const userId = await getSessionUserId();

  // Fetch the post and community data
  const post = await readPost(id);
  if (!post) {
    return <div>Post not found</div>;
  }

  const [comments, community] = await Promise.all([
    fetchCommentsByPost({ postId: id, limit: 10 }),
    readCommunityById(post.communityId),
  ]);

  const postVotes = post.votes || [];
  const userVote = postVotes.find((vote) => vote.userId === userId) || null;
  const totalComments = post.totalComments;

  const isMemberOfCommunity = community
    ? await isUserMemberOfCommunity(community.id)
    : false;

  async function loadMoreComments(
    cursor?: string
  ): Promise<[ExtendedComment[], string | null]> {
    'use server';
    if (!post) {
      throw new Error('Post not found');
    }
    const c = await fetchCommentsByPost({ postId: post.id, cursor });
    return [c?.comments || [], c?.nextCursor || null];
  }

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
          {comments && (
            <CommentsProvider
              initialCount={totalComments}
              initialComments={comments.comments}
            >
              <footer className='flex items-center justify-between'>
                <PostVote post={post} vote={userVote} userId={userId} />
                <PostCommentsCount />
              </footer>

              <LoadMorePostComments
                loadMoreAction={loadMoreComments}
                initialCursor={comments.nextCursor}
              >
                <CommentsSection post={post} />
              </LoadMorePostComments>
            </CommentsProvider>
          )}
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
