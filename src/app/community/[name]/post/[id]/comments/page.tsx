import React from 'react';
import { fetchCommentsByPost } from '@/actions/commentActions';
import {
  isUserMemberOfCommunity,
  logCommunityVisit,
  readCommunityById,
} from '@/actions/communityActions';
import { readPost } from '@/actions/postActions';
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
import { CommentsProvider } from '@/app/components/comment/CommentsContext';
import PostVote from '@/app/components/client/PostVote';
import CommentsSection from '@/app/components/presentational/CommentsSection';
import { ExtendedComment } from '@prisma/client';
import LoadMoreComments from '@/app/components/client/LoadMoreComments';

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
    fetchCommentsByPost({ postId: id, limit: 10 }),
    readCommunityById(post.communityId),
  ]);

  if (community && userId) await logCommunityVisit(userId, community.id);

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
    if (!post) throw new Error('User not found');
    const c = await fetchCommentsByPost({
      postId: post.id,
      cursor,
    });
    const comments = c?.comments || [];
    const nextCursor = c?.nextCursor || null;
    return [comments, nextCursor];
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
              {/*comentariile de aici trebuie sa fie optimistic si cand loadmore incarca mai multe le adauga, iar comment section le afiseaza */}
              <footer className='flex items-center justify-between'>
                <PostVote post={post} vote={userVote} />
                <PostCommentsCount />
              </footer>

              {comments && (
                <LoadMoreComments
                  loadMoreAction={loadMoreComments}
                  initialCursor={comments.nextCursor}
                >
                  <CommentsSection post={post} />
                </LoadMoreComments>
              )}
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
