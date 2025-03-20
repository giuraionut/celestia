import { fetchUserProfileByName } from '@/actions/authActions';
import { loadMoreUserPosts } from '@/actions/loadMoreActions';
import { readPostsByUserId } from '@/actions/postActions';
import LoadMore from '@/app/components/shared/LoadMore';
import PostList from '@/app/components/post/PostList';
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

const UserPagePosts = async ({
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

  const initialPostsSort = sort || 'newest';

  const postsSortParams = getSortParams(initialPostsSort);

  const user = await fetchUserProfileByName({ name: decodedName });
  if (!user || user.isDeleted) return <div>User not found</div>;

  const postData = await readPostsByUserId({
    userId: user.id,
    limit: 5,
    sortBy: postsSortParams.sortBy,
    sortOrder: postsSortParams.sortOrder,
  });
  const { posts: initialPosts = [], nextCursor: initialPostCursor } =
    postData || {};

  const postListKey = `post-list-${initialPostsSort}`;

  return (
    <HolyGrail>
      <Left></Left>
      <Middle>
        <SortProvider initialSort={initialPostsSort}>
          <SortingControls title='Posts' />
          <LoadMore
            loadMoreAction={loadMoreUserPosts}
            initialCursor={initialPostCursor}
          >
            <PostList key={postListKey} posts={initialPosts} userId={user.id} />
          </LoadMore>
        </SortProvider>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserPagePosts;
