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
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';
import UserBanner from '@/app/components/shared/UserBanner';
import { Metadata } from 'next';
import { generateUserPageMetadata } from '@/lib/metadataUtils';
import Blackhole from '@/app/components/svgs/Blackhole';
import EmptyContent from '@/app/components/shared/EmptyContent';

interface UserPagePostsProps {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ sort?: string; activeTab?: string }>;
}

export async function generateMetadata({
  params,
}: UserPagePostsProps): Promise<Metadata> {
  return generateUserPageMetadata({ params: params, pageContext: 'Posts' });
}

const UserPagePosts = async ({
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

  const initialPostsSort = sort || 'newest';

  const postsSortParams = getSortParams(initialPostsSort);

  const user = await fetchUserProfileByName({ name: decodedName });
  if (!user || user.isDeleted)
    return (
      <EmptyContent message='Looks like there are no communities which means you cannot create posts. Please create a community first.' />
    );

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
        <UserBanner user={user} />
        <UserProfileContentButtons
          userName={user.name || ''}
          className='w-full p-4 flex items-center gap-4'
          page='posts'
        />
        {postData && postData?.posts.length > 0 ? (
          <SortProvider initialSort={initialPostsSort} contentType='posts'>
            <div className='max-w-[700px] w-full items-center flex px-4'>
              <SortingControls />
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
          <div>
            <Blackhole className='h-48 w-48 mx-auto' />
            <p>
              Looks like there are no posts, they were probably eaten by the
              black hole.
            </p>
          </div>
        )}
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserPagePosts;
