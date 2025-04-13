import { fetchUserProfileByName } from '@/actions/authActions';
import { loadMoreUserPosts } from '@/actions/loadMoreActions';
import { readHiddenPostsByUserId } from '@/actions/postActions';
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
import { cn, getSortParams } from '@/lib/utils';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';
import UserBanner from '@/app/components/shared/UserBanner';

const UserHiddenPosts = async ({
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
  const { sort } = (await searchParams) || {};
  const decodedName = decodeURIComponent(name);

  const initialPostsSort = sort || 'newest';

  const postsSortParams = getSortParams(initialPostsSort);

  const user = await fetchUserProfileByName({ name: decodedName });
  if (!user || user.isDeleted) return <div>User not found</div>;

  const postData = await readHiddenPostsByUserId({
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
        <UserBanner user={user} />
        <UserProfileContentButtons
          userName={user.name || ''}
          className='w-full p-4 flex items-center gap-4'
          page='hidden'
        />
        {postData && postData?.posts.length > 0 ? (
          <SortProvider initialSort={initialPostsSort} contentType='posts'>
            <div className='max-w-[700px] w-full items-center flex px-4'>
              <SortingControls />
            </div>
            <LoadMore
              loadMoreAction={loadMoreUserPosts}
              initialCursor={initialPostCursor}
              userId={user.id}
            >
              <PostList
                key={postListKey}
                posts={initialPosts}
                userId={user.id}
                showHidden={true}
              />
            </LoadMore>
          </SortProvider>
        ) : (
          <div>No posts found.</div>
        )}
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserHiddenPosts;
