import {
  isUserMemberOfCommunity,
  logCommunityVisit,
  readCommunityByName,
} from '@/actions/communityActions';
import { readPosts } from '@/actions/postActions';
import { fetchPosts, POSTS_PER_PAGE } from '@/actions/loadMoreActions';
import React, { ReactNode } from 'react';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import LoadMore from '@/app/components/post/LoadMorePosts';
import PostList from '@/app/components/post/PostList';
import CommunityBanner from '@/app/components/community/CommunityBanner';
import { getSessionUserId } from '@/actions/actionUtils';

type CommunityPageProps = {
  params: { name: string };
};

const CommunityPage = async ({ params }: CommunityPageProps) => {
  try {
    const { name } = params;
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
      limit: POSTS_PER_PAGE,
    });
    const initialPosts = postsData?.posts ?? [];
    const initialCursor = postsData?.nextCursor ?? null;

    // Define a dedicated server action for loading more posts.
    async function loadMoreCommunityPosts(
      cursor?: string
    ): Promise<[ReactNode, string | null]> {
      'use server';
      if (!community) {
        throw new Error("Community is null");
      }
      const { posts, nextCursor, userId: fetchedUserId } = await fetchPosts(cursor, community.id);
      return [
        <PostList key={cursor ?? 'initial'} posts={posts} userId={fetchedUserId} />,
        nextCursor,
      ];
    }

    return (
      <HolyGrail>
        <Left />
        <Middle>
          <div className="w-full px-4">
            <CommunityBanner
              community={community}
              isMemberOfCommunity={isMemberOfCommunity}
              userId={userId}
            />
            <LoadMore loadMoreAction={loadMoreCommunityPosts} initialCursor={initialCursor}>
              <PostList posts={initialPosts} userId={userId} />
            </LoadMore>
          </div>
        </Middle>
        <Right>
          <div className="sticky top-0 w-full p-4">Column 1</div>
        </Right>
      </HolyGrail>
    );
  } catch (error) {
    console.error("Error loading community page:", error);
    return (
      <div>
        There was an error loading the community. Please try again later.
      </div>
    );
  }
};

export default CommunityPage;
