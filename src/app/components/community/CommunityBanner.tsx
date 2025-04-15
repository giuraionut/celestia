import React from 'react';
import Image from 'next/image';
import JoinCommunityButton from './JoinCommunityButton';
import { ExtendedCommunity } from '@prisma/client';
import { getSessionUserId } from '@/actions/actionUtils';
import { cn } from '@/lib/utils';
import ManageCommunityButton from './ManageCommunityButton';
import UserHoverCard from '../shared/UserHoverCard';

type CommunityBannerProps = {
  community: ExtendedCommunity;
  userId: string | null;
  isMemberOfCommunity: boolean;
  isManagerOfCommunity: boolean;
  className?: string;
};

const CommunityBanner = async ({
  community,
  isMemberOfCommunity,
  isManagerOfCommunity,
  className,
}: CommunityBannerProps) => {
  console.log('community banner');
  const userId = await getSessionUserId();

  return (
    <div
      className={cn(
        'border rounded-sm flex flex-col gap-4 h-fit w-full',
        className
      )}
    >
      <div className='relative flex flex-col sm:flex-row gap-4 rounded-t-sm p-4 w-full'>
        <Image
          src={community.image || '/defaultCommunityImage.png'}
          className='w-20 h-20 rounded-full object-cover ring-2 ring-accent-foreground flex-shrink-0'
          alt={community.name}
          width={80}
          height={80}
        />
        <div className='w-full flex flex-col'>
          <div className='flex flex-col'>
            <div className='md:text-3xl sm:text-2xl text-xl font-bold'>
              {community.name}
            </div>
            <div className='flex items-center justify-between w-full'>
              <div className='text-xs md:text-base flex gap-1'>
                Created by
                <UserHoverCard user={community.author!} />
              </div>
            </div>
          </div>
        </div>
        <JoinCommunityButton
          communityId={community.id}
          isMemberOfCommunity={isMemberOfCommunity}
          userId={userId}
        />
        {isManagerOfCommunity && <ManageCommunityButton />}
        <div className='absolute inset-0 bg-accent -z-10 rounded-t-sm'></div>
      </div>

      <div className='pb-4 px-4'>
        <div>{community.description}</div>
      </div>
    </div>
  );
};

export default CommunityBanner;
