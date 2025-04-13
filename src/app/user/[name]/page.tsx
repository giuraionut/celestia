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
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';
import { OverviewItem, OverviewPost, OverviewComment } from '@/types/types';
import UserBanner from '@/app/components/shared/UserBanner';

interface UserOverviewPageProps {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ sort?: string; activeTab?: string }>;
}

const UserPage = async ({ params, searchParams }: UserOverviewPageProps) => {
  const { name } = await params;
  const resolvedSearchParams = await searchParams;
  const { sort } = resolvedSearchParams || {};
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialItems: any[] = overviewData?.items || [];

  initialItems = initialItems.map((item) => {
    if (item.type === 'post' || item.type === 'comment') {
      return item as OverviewItem;
    }
    if (item.community) {
      return { ...item, type: 'post' as const } as OverviewPost;
    }
    return { ...item, type: 'comment' as const } as OverviewComment;
  });

  const initialOverviewCursor = overviewData?.nextCursor;
  const initialCursorStr = initialOverviewCursor
    ? new Date(initialOverviewCursor).toISOString()
    : null;
  const overviewListKey = `overview-list-${initialOverviewSort}`;

  return (
    <HolyGrail>
      <Left />
      <Middle>
        <UserBanner user={user} />
        <UserProfileContentButtons
          userName={user.name || ''}
          className='w-full p-4 flex items-center gap-4'
        />
        {initialItems.length > 0 ? (
          <SortProvider
            initialSort={initialOverviewSort}
            contentType='overview'
          >
            <div className='max-w-[700px] w-full flex items-center p-4'>
              <SortingControls />
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
