import React from 'react';
import {
  fetchCommentsByPost,
  readCommentWithAncestors,
} from '@/actions/commentActions';
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
import { formatDistanceToNow } from 'date-fns';
import CommunityHeader from '@/app/components/community/CommunityHeader';
import UserHoverCard from '@/app/components/shared/UserHoverCard';
import { generatePostMetadata } from '@/lib/metadataUtils';
import { Metadata } from 'next';
import EmptyContent from '@/app/components/shared/EmptyContent';

interface PostPageProps {
  params: Promise<{ postId: string; commentId: string }>;
}
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  return generatePostMetadata({
    params: params,
  });
}

const PostPage = async ({ params }: PostPageProps) => {
  const { postId, commentId } = await params;
  const userId = await getSessionUserId();

  const post = await readPost(postId);
  if (!post) {
    return (
      <EmptyContent message='Looks like the post you are looking for does not exist.' />
    );
  }

  const [commentsData, community] = await Promise.all([
    fetchCommentsByPost({ postId: postId, limit: 10 }),
    readCommunityById(post.communityId),
  ]);

  const singleComment = commentId
    ? await readCommentWithAncestors(commentId[0])
    : null;

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
        <div className='max-w-[700px] flex flex-col gap-4 w-full p-4'>
          {community && (
            <CommunityHeader
              name={community.name}
              image={community.image}
              textSize='text-md'
            />
          )}
          <div className='flex items-center gap-1 flex-row text-xs'>
            Posted by {post.author && <UserHoverCard user={post.author} />}
            <span className='text-xs'>
              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
            </span>
          </div>
          <PostCard post={post} />
          {commentsData && (
            <CommentsProvider
              initialCount={totalComments}
              initialComments={
                singleComment ? [singleComment] : commentsData.comments
              }
            >
              <footer className='flex items-center justify-between'>
                <PostVote post={post} vote={userVote} userId={userId} />
                <PostCommentsCount />
              </footer>

              <LoadMorePostComments
                loadMoreAction={loadMoreComments}
                initialCursor={commentsData.nextCursor}
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
            />
          )}
        </div>
      </Right>
    </HolyGrail>
  );
};

export default PostPage;
