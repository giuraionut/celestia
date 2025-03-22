import {
  findCommunityByName,
  isUserMemberOfCommunity,
  logCommunityVisit,
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
import { Cake, User2Icon, UserIcon } from 'lucide-react';

type CommunityPageProps = {
  params: { name: string };
};

const CommunityPage = async ({ params }: CommunityPageProps) => {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    // Fetch community data (available to all users)
    const community = await findCommunityByName(decodedName);
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
              className='mb-4'
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
          <div className='sticky top-0 w-full p-4'>
            <div className='flex flex-col gap-4 p-4 border rounded-md'>
              <span className='inline-flex gap-2'>
                <User2Icon />{' '}
                <span>
                  Total Managers{' '}
                  <span className='font-bold'>{community.totalManagers}</span>
                </span>
              </span>
              <span className='inline-flex gap-2'>
                <UserIcon />{' '}
                <span>
                  Total Members{' '}
                  <span className='font-bold'>{community.totalMembers}</span>
                </span>
              </span>
              <span className='inline-flex gap-2'>
                <Cake />{' '}
                <span>
                  Created at{' '}
                  <span className='font-bold'>
                    {community.createdAt.toDateString()}
                  </span>
                </span>
              </span>
            </div>
          </div>
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
