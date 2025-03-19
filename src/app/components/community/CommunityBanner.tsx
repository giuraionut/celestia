import React from 'react';
import Image from 'next/image';
import JoinCommunityButton from './JoinCommunityButton';
import { ExtendedCommunity } from '@prisma/client';
import { getSessionUserId } from '@/actions/actionUtils';

type CommunityBannerProps = {
  community: ExtendedCommunity;
  userId: string | null;
  isMemberOfCommunity: boolean;
};

const CommunityBanner = async ({
  community,
  isMemberOfCommunity,
}: CommunityBannerProps) => {
  console.log('community banner');
  const userId = await getSessionUserId();

  return (
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
            communityId={community.id}
            isMemberOfCommunity={isMemberOfCommunity}
            userId={userId}
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
  );
};

export default CommunityBanner;
