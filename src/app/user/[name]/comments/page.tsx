import { fetchUserProfileByName } from '@/actions/authActions';
import { readCommentsByUserId } from '@/actions/commentActions';
import { loadMoreUserComments } from '@/actions/loadMoreActions';
import CommentList from '@/app/components/comment/CommentList';
import LoadMore from '@/app/components/shared/LoadMore';
import { SortProvider } from '@/app/components/post/PostSortingContext';
import { SortingControls } from '@/app/components/post/PostSortingControls';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import { getSortParams } from '@/lib/utils';
import React from 'react';
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';
import UserBanner from '@/app/components/shared/UserBanner';
import { Metadata } from 'next';
import { generateUserPageMetadata } from '@/lib/metadataUtils';
import Blackhole from '@/app/components/svgs/Blackhole';
import EmptyContent from '@/app/components/shared/EmptyContent';

interface UserPageCommentsProps {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ sort?: string; activeTab?: string }>;
}

export async function generateMetadata({
  params,
}: UserPageCommentsProps): Promise<Metadata> {
  return generateUserPageMetadata({ params: params, pageContext: 'Comments' });
}
const UserPageComments = async ({
  params,
  searchParams,
}: UserPageCommentsProps) => {
  const { name } = await params;
  const resolvedSearchParams = await searchParams;
  const { sort } = resolvedSearchParams || {};
  const decodedName = decodeURIComponent(name);

  const initialCommentsSort = sort || 'newest';

  const commentsSortParams = getSortParams(initialCommentsSort);

  const user = await fetchUserProfileByName({ name: decodedName });
  if (!user || user.isDeleted)
    return (
      <EmptyContent message='Looks like the user you are looking for does not exist.' />
    );

  const commentData = await readCommentsByUserId({
    userId: user.id,
    limit: 5,
    sortBy: commentsSortParams.sortBy,
    sortOrder: commentsSortParams.sortOrder,
  });
  const { comments: initialComments = [], nextCursor: initialCommentsCursor } =
    commentData || {};

  const commentListKey = `comment-list-${initialCommentsSort}`;

  return (
    <HolyGrail>
      <Left></Left>
      <Middle>
        <UserBanner user={user} />
        <UserProfileContentButtons
          userName={user.name || ''}
          className='w-full p-4 flex items-center gap-4'
          page='comments'
        />
        {commentData && commentData.comments.length > 0 ? (
          <SortProvider
            initialSort={initialCommentsSort}
            contentType='comments'
          >
            <div className='max-w-[700px] w-full items-center flex px-4'>
              <SortingControls />
            </div>
            <LoadMore
              loadMoreAction={loadMoreUserComments}
              initialCursor={initialCommentsCursor}
              userId={user.id} // Pass the user ID here
            >
              <CommentList
                key={commentListKey}
                comments={initialComments}
                userId={user.id}
              />
            </LoadMore>
          </SortProvider>
        ) : (
          <div>
            <Blackhole className='h-48 w-48 mx-auto' />
            <p>
              Looks like there are no comments, they were probably eaten by the
              black hole.
            </p>
          </div>
        )}
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserPageComments;
