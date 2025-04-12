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
import { cn, getSortParams } from '@/lib/utils';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';

const UserPageComments = async ({
  params,
  searchParams,
}: {
  params: Promise<{ name: string; page: string }>;

  searchParams?: Promise<{
    sort?: string;
    activeTab?: string;
  }>;
}) => {
  const { name } = await params;
  const resolvedSearchParams = await searchParams;
  const { sort } = resolvedSearchParams || {};
  const decodedName = decodeURIComponent(name);

  const initialCommentsSort = sort || 'newest';

  const commentsSortParams = getSortParams(initialCommentsSort);

  const user = await fetchUserProfileByName({ name: decodedName });
  if (!user || user.isDeleted) return <div>User not found</div>;

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
        <div className='w-full p-4 flex items-center gap-4'>
          <Avatar className={cn('cursor-pointer w-16 h-16')}>
            <AvatarImage
              className='rounded-full '
              src={user.image || undefined}
              alt={user.name || undefined}
            />
            <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <h1 className='text-2xl font-bold'>{user.name}</h1>
        </div>
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
          <div>No comments found.</div>
        )}
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserPageComments;
