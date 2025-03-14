import {
  isUserMemberOfCommunity,
  readCommunityByName,
} from '@/actions/communityActions';
import React from 'react';
import Image from 'next/image';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/presentational/HolyGrail';
import JoinCommunityButton from '@/app/components/client/JoinCommunityButton';
import { readPosts } from '@/actions/postActions';
import LoadMore from '@/app/components/client/LoadMore';
import PostList from '@/app/components/client/PostList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchPosts, POSTS_PER_PAGE } from '@/actions/loadMoreActions';
import { ReactNode } from 'react';

const CommunityPage = async ({ params }: { params: { name: string } }) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id; 
  const { name } = params;
  const community = await readCommunityByName(name);
  
  if (!community) return <div>Loading...</div>;
  
  const communityId = community.id;
  
  // We've already checked that community exists, so we can safely use community.id
  const isMemberOfCommunity = await isUserMemberOfCommunity(communityId) || false;

  // Initial posts fetch
  const result = await readPosts({
    communityId,
    limit: POSTS_PER_PAGE,
  });
  const initialPosts = result?.posts || [];
  const initialCursor = result?.nextCursor;
  
  // Define a dedicated server action for this community
  // We're capturing the communityId in the closure to ensure it's available
  async function loadMoreCommunityPosts(cursor?: string): Promise<[ReactNode, string | null]> {
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
        <div className=' w-full px-4'>
          {/* Community header */}
          <div className='border rounded-lg flex flex-col gap-4 h-fit'>
            <div className='relative flex gap-4 rounded-t-lg p-4 w-full'>
              <div className='flex flex-col gap-4 items-center'>
                <Image
                  src={community.image}
                  className='w-20 h-20 rounded-full object-contain'
                  alt={community.name}
                  width={200}
                  height={200}
                />
                <JoinCommunityButton
                  communityId={communityId}
                  isMemberOfCommunity={isMemberOfCommunity}
                />
              </div>
              <div className='w-full flex flex-col'>
                <div className='text-4xl font-bold'>{community.name}</div>
                <div className='flex items-center justify-between w-full'>
                  <div>
                    Created by {community.author?.name} on{' '}
                    {new Date(community.createdAt).toDateString()}
                  </div>
                </div>
              </div>
              <div className='absolute inset-0 bg-accent -z-10'></div>
            </div>
            <div className='pb-4 px-4'>
              <div>{community.description}</div>
            </div>
          </div>
          {/* Posts section */}
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