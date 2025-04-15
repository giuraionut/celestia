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
import { getSortParams } from '@/lib/utils';
import React from 'react';
import UserProfileContentButtons from '@/app/components/shared/UserProfileContentButtons';
import UserBanner from '@/app/components/shared/UserBanner';
import { Metadata } from 'next';
import { generateUserPageMetadata } from '@/lib/metadataUtils';
import Blackhole from '@/app/components/svgs/Blackhole';
import EmptyContent from '@/app/components/shared/EmptyContent';

interface UserHiddenPostsProps {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{ sort?: string; activeTab?: string }>;
}

export async function generateMetadata({
  params,
}: UserHiddenPostsProps): Promise<Metadata> {
  return generateUserPageMetadata({
    params: params,
    pageContext: 'Hidden Posts',
  });
}

const UserHiddenPosts = async ({
  params,
  searchParams,
}: UserHiddenPostsProps) => {
  const { name } = await params;
  const { sort } = (await searchParams) || {};
  const decodedName = decodeURIComponent(name);

  const initialPostsSort = sort || 'newest';

  const postsSortParams = getSortParams(initialPostsSort);

  const user = await fetchUserProfileByName({ name: decodedName });
  if (!user || user.isDeleted) return <EmptyContent message='Looks like the user you are looking for does not exist.' />;

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
          <div>
            <Blackhole className='h-48 w-48 mx-auto' />
            <p>
              Looks like there are no hidden posts, they were probably eaten by
              the black hole.
            </p>
          </div>
        )}
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserHiddenPosts;
