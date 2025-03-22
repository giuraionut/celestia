// app/user/overview/page.tsx
import React from 'react';
import { fetchUserProfileByName } from '@/actions/authActions';
import { loadMoreUserPostsAndComments } from '@/actions/loadMoreActions';
import { readCommentsAndPostsByUserId } from '@/actions/postCommentActions';
import LoadMore from '@/app/components/shared/LoadMore';
import { SortProvider } from '@/app/components/post/PostSortingContext';
import { SortingControls } from '@/app/components/post/PostSortingControls';
import { HolyGrail, Left, Middle, Right } from '@/app/components/shared/HolyGrail';
import { getSortParams } from '@/lib/utils';
import OverviewList from '@/app/components/shared/OverviewList';

const UserPage = async ({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams?: { sort?: string; activeTab?: string };
}) => {
  const { name } = params;
  const { sort } = searchParams || {};
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
  const { items: initialItems = [], nextCursor: initialOverviewCursor } = overviewData || {};

  // Convert initialOverviewCursor to a string if it's not null.
  const initialCursorStr = initialOverviewCursor ? new Date(initialOverviewCursor).toISOString() : null;
  const overviewListKey = `overview-list-${initialOverviewSort}`;

  return (
    <HolyGrail>
      <Left />
      <Middle>
        <SortProvider initialSort={initialOverviewSort} contentType="overview">
          <div className="max-w-[700px] w-full items-center flex p-4">
            <SortingControls title="Overview" />
          </div>
          <LoadMore
            loadMoreAction={loadMoreUserPostsAndComments}
            initialCursor={initialCursorStr}
            userId={user.id}
          >
            <OverviewList key={overviewListKey} items={initialItems} userId={user.id} />
          </LoadMore>
        </SortProvider>
      </Middle>
      <Right />
    </HolyGrail>
  );
};

export default UserPage;
