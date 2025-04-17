import {
  findCommunityByName,
  isUserManagerOfCommunity,
  isUserMemberOfCommunity,
  logCommunityVisit,
} from '@/actions/communityActions';
import { readPosts } from '@/actions/postActions';
import React from 'react';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import LoadMore from '@/app/components/shared/LoadMore';
import PostList from '@/app/components/post/PostList';
import CommunityBanner from '@/app/components/community/CommunityBanner';
import { getSessionUserId } from '@/actions/actionUtils';
import { SortProvider } from '@/app/components/post/PostSortingContext';

import { SortingControls } from '@/app/components/post/PostSortingControls';
import { getSortParams } from '@/lib/utils';
import { loadMorePosts } from '@/actions/loadMoreActions';
import { generateCommunityMetadata } from '@/lib/metadataUtils';
import { Metadata } from 'next';
import ErrorContent from '@/app/components/shared/ErrorContent';
import CommunityOverviewCard from '@/app/components/community/CommunityOverviewCard';

type CommunityPageProps = {
  params: Promise<{ name: string }>;
  searchParams?: Promise<{
    sort?: string;
  }>;
};

export async function generateMetadata({
  params,
}: CommunityPageProps): Promise<Metadata> {
  return generateCommunityMetadata({
    params: params,
    pageContext: 'Community',
  });
}

const CommunityPage = async ({ params, searchParams }: CommunityPageProps) => {
  try {
    const { name } = await params;
    const resolvedSearchParams = await searchParams;
    const { sort } = resolvedSearchParams || {};
    const initialSort = sort || 'newest';
    const decodedName = decodeURIComponent(name);
    const sortParams = getSortParams(initialSort);

    const community = await findCommunityByName(decodedName);

    if (!community) {
      return (
        <ErrorContent message='Something went wrong while loading the community page.' />
      );
    }

    const userId = await getSessionUserId();
    const isPrivate = community.isPrivate;
    const isMemberOfCommunity = userId
      ? await isUserMemberOfCommunity(community.id, userId)
      : false;
    const isManagerOfCommunity = userId
      ? await isUserManagerOfCommunity(community.id, userId)
      : false;

    const isMemberBanned =
      community.bannedUsers?.some(
        (bannedMember) => bannedMember.userId === userId
      ) || false;
    if (isMemberBanned) {
      return (
        <HolyGrail>
          <Left></Left>
          <Middle>You are banned from this community</Middle>
          <Right></Right>
        </HolyGrail>
      );
    }
    if (isPrivate && !isMemberOfCommunity && !isManagerOfCommunity) {
      return (
        <div>
          This community is private. You need to be a member or manager to view
          it.
        </div>
      );
    }

    if (userId) {
      await logCommunityVisit(community.id, userId);
    }

    const postData = await readPosts({
      communityId: community.id,
      limit: 5,
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder,
    });
    const { posts: initialPosts = [], nextCursor: initialCursor } =
      postData || {};

    const postListKey = `post-list-${initialSort}`;

    return (
      <HolyGrail>
        <Left />
        <Middle>
          <div className='w-full px-4'>
            <CommunityBanner
              community={community}
              showButtons={true}
              isMemberOfCommunity={isMemberOfCommunity}
              isManagerOfCommunity={isManagerOfCommunity}
              className='mb-4'
            />
            {initialPosts.length > 0 && (
              <SortProvider initialSort={initialSort}>
                <div className='max-w-[700px] w-full items-center flex p-4'>
                  <SortingControls />
                </div>
                <LoadMore
                  loadMoreAction={loadMorePosts}
                  initialCursor={initialCursor}
                >
                  <PostList
                    key={postListKey}
                    posts={initialPosts}
                    userId={userId}
                  />
                </LoadMore>
              </SortProvider>
            )}
            {initialPosts.length === 0 && (
              <div className='text-center'>No posts found.</div>
            )}
          </div>
        </Middle>
        <Right>
          <CommunityOverviewCard community={community} />
        </Right>
      </HolyGrail>
    );
  } catch (error) {
    console.error('Error loading community page:', error);
    return (
      <ErrorContent message='Something went wrong while loading the community page.' />
    );
  }
};

export default CommunityPage;
