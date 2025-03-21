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

const UserPageComments = async ({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams?: {
    sort?: string;
    activeTab?: string;
  };
}) => {
  const { name } = await params;
  const { sort } = (await searchParams) || {};
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
        <SortProvider initialSort={initialCommentsSort} contentType='comments'>
          <div className='max-w-[700px] w-full items-center flex px-4'>
            <SortingControls title='Comments' />
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
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserPageComments;