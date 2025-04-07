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
import { cn, getSortParams } from '@/lib/utils';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';

const UserPagePosts = async ({
  params,
  searchParams,
}: {
  params: { name: string; page: string };

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
          page='posts'
        />
        {postData && postData?.posts.length > 0 ? (
          <SortProvider initialSort={initialPostsSort} contentType='posts'>
            <div className='max-w-[700px] w-full items-center flex px-4'>
              <SortingControls title='Posts' />
            </div>
            <LoadMore
              loadMoreAction={loadMoreUserPosts}
              initialCursor={initialPostCursor}
              userId={user.id} // Pass userId here
            >
              <PostList
                key={postListKey}
                posts={initialPosts}
                userId={user.id}
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

export default UserPagePosts;
