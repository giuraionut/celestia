import {
  isUserMemberOfCommunity,
  logCommunityVisit,
  readCommunityByName,
} from '@/actions/communityActions';
import { readPosts } from '@/actions/postActions';
import React, { ReactNode } from 'react';
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

type CommunityPageProps = {
  params: { name: string };
};

const CommunityPage = async ({ params }: CommunityPageProps) => {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    // Fetch community data (available to all users)
    const community = await readCommunityByName(decodedName);
    if (!community) {
      return <div>Community not found.</div>;
    }

    // Get the session user ID (if any)
    const userId = await getSessionUserId();

    // For actions that require authentication, check if a user is logged in.
    if (userId) {
      await logCommunityVisit(community.id, userId);
    }

    // Only check membership if the user is authenticated
    const isMemberOfCommunity = userId
      ? await isUserMemberOfCommunity(community.id, userId)
      : false;

    // Fetch initial posts
    const postsData = await readPosts({
      communityId: community.id,
      limit: 5,
    });
    const initialPosts = postsData?.posts ?? [];
    const initialCursor = postsData?.nextCursor ?? null;

    // Define a dedicated server action for loading more posts.
    async function loadMoreCommunityPosts(options: {
      cursor?: string;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    }): Promise<[ReactNode, string | null]> {
      'use server';
      if (!community) {
        throw new Error('Community is null');
      }
      const { cursor } = options;
      const postsData = await readPosts({
        communityId: community.id,
        cursor,
        limit: 5,
      });
      const { posts: initialPosts = [], nextCursor: initialCursor } =
        postsData || {};
      return [
        <PostList
          key={cursor ?? 'initial'}
          posts={initialPosts}
          userId={userId}
        />,
        initialCursor || null,
      ] as const;
    }

    return (
      <HolyGrail>
        <Left />
        <Middle>
          <div className='w-full px-4'>
            <CommunityBanner
              community={community}
              isMemberOfCommunity={isMemberOfCommunity}
              userId={userId}
            />
            <SortProvider initialSort='newest'>
            <LoadMore
              loadMoreAction={loadMoreCommunityPosts}
              initialCursor={initialCursor}
            >
              <PostList posts={initialPosts} userId={userId} />
            </LoadMore>
            </SortProvider>
          </div>
        </Middle>
        <Right>
          <div className='sticky top-0 w-full p-4'>Column 1</div>
        </Right>
      </HolyGrail>
    );
  } catch (error) {
    console.error('Error loading community page:', error);
    return (
      <div>
        There was an error loading the community. Please try again later.
      </div>
    );
  }
};

export default CommunityPage;
