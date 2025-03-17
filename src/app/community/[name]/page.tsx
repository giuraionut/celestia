import {
  isUserMemberOfCommunity,
  readCommunityByName,
} from '@/actions/communityActions';
import React from 'react';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import { readPosts } from '@/actions/postActions';
import LoadMore from '@/app/components/post/LoadMorePosts';
import PostList from '@/app/components/post/PostList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchPosts, POSTS_PER_PAGE } from '@/actions/loadMoreActions';
import { ReactNode } from 'react';
import CommunityBanner from '@/app/components/community/CommunityBanner';

const CommunityPage = async ({ params }: { params: { name: string } }) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const community = await readCommunityByName(decodedName);

  if (!community) return <div>Loading...</div>;

  const communityId = community.id;

  // We've already checked that community exists, so we can safely use community.id
  const isMemberOfCommunity =
    (await isUserMemberOfCommunity(communityId)) || false;

  // Initial posts fetch
  const result = await readPosts({
    communityId,
    limit: POSTS_PER_PAGE,
  });
  const initialPosts = result?.posts || [];
  const initialCursor = result?.nextCursor;

  // Define a dedicated server action for this community
  // We're capturing the communityId in the closure to ensure it's available
  async function loadMoreCommunityPosts(
    cursor?: string
  ): Promise<[ReactNode, string | null]> {
    'use server';

    // communityId is now guaranteed to be defined since we've checked for null community
    const { posts, nextCursor, userId } = await fetchPosts(cursor, communityId);

    return [
      <PostList key={cursor || 'initial'} posts={posts} userId={userId} />,
      nextCursor,
    ];
  }

  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='w-full px-4'>
          {/* Community Header */}
          <CommunityBanner
            community={community}
            isMemberOfCommunity={isMemberOfCommunity}
          />
          {/* Posts Section */}
          <LoadMore
            loadMoreAction={loadMoreCommunityPosts}
            initialCursor={initialCursor}
          >
            <PostList posts={initialPosts} userId={userId} />
          </LoadMore>
        </div>
      </Middle>
      <Right>
        <div className='sticky top-0 w-full p-4'>Column 1</div>
      </Right>
    </HolyGrail>
  );
};

export default CommunityPage;
