// app/user/overview/page.tsx
import React from 'react';
import { fetchUserProfileByName } from '@/actions/authActions';
import { loadMoreUserPostsAndComments } from '@/actions/loadMoreActions';
import { readCommentsAndPostsByUserId } from '@/actions/postCommentActions';
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
import OverviewList from '@/app/components/shared/OverviewList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';

const UserPage = async ({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams?: { sort?: string; activeTab?: string };
}) => {
  const { name } = await params;
  const { sort } = (await searchParams) || {};
  const decodedName = decodeURIComponent(name);
  const initialOverviewSort = sort || 'newest';
  const overviewSortParams = getSortParams(initialOverviewSort);

  const user = await fetchUserProfileByName({ name: decodedName });
  if (!user || user.isDeleted) return <div>User not found</div>;

  const overviewData = await readCommentsAndPostsByUserId({
    userId: user.id,
    limit: 5,
    sortBy: overviewSortParams.sortBy,
    sortOrder: overviewSortParams.sortOrder,
  });
  const { items: initialItems = [], nextCursor: initialOverviewCursor } =
    overviewData || {};

  // Convert initialOverviewCursor to a string if it's not null.
  const initialCursorStr = initialOverviewCursor
    ? new Date(initialOverviewCursor).toISOString()
    : null;
  const overviewListKey = `overview-list-${initialOverviewSort}`;
  console.log(overviewData.items, 'overviewData.items');
  return (
    <HolyGrail>
      <Left />
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
        />
        {overviewData.items.length > 0 ? (
          <SortProvider
            initialSort={initialOverviewSort}
            contentType='overview'
          >
            <div className='max-w-[700px] w-full items-center flex p-4'>
              <SortingControls title='Overview' />
            </div>
            <LoadMore
              loadMoreAction={loadMoreUserPostsAndComments}
              initialCursor={initialCursorStr}
              userId={user.id}
            >
              <OverviewList
                key={overviewListKey}
                items={initialItems}
                userId={user.id}
              />
            </LoadMore>
          </SortProvider>
        ) : (
          <div className='text-center'>No posts or comments yet.</div>
        )}
      </Middle>
      <Right />
    </HolyGrail>
  );
};

export default UserPage;
