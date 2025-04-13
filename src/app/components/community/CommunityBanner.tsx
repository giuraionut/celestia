import React from 'react';
import Image from 'next/image';
import JoinCommunityButton from './JoinCommunityButton';
import { ExtendedCommunity } from '@prisma/client';
import { getSessionUserId } from '@/actions/actionUtils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type CommunityBannerProps = {
  community: ExtendedCommunity;
  userId: string | null;
  isMemberOfCommunity: boolean;
  className?: string;
};

const CommunityBanner = async ({
  community,
  isMemberOfCommunity,
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
          className='w-20 h-auto rounded-full object-cover ring-2 ring-accent-foreground'
          alt={community.name}
          width={200}
          height={200}
        />

        <div className='w-full flex flex-col'>
          <div className='flex flex-col'>
            <div className='md:text-3xl sm:text-2xl text-xl font-bold'>
              {community.name}
            </div>
            <div className='flex items-center justify-between w-full'>
              <div className='text-xs md:text-base'>
                Created by{' '}
                <Link
                  href={`/user/${community.author?.name}`}
                  className='text-primary/50 hover:text-primary transition-colors'
                >
                  {community.author?.name}
                </Link>{' '}
              </div>
            </div>
          </div>
        </div>
        <JoinCommunityButton
          communityId={community.id}
          isMemberOfCommunity={isMemberOfCommunity}
          userId={userId}
        />
        <div className='absolute inset-0 bg-accent -z-10 rounded-t-sm'></div>
      </div>

      <div className='pb-4 px-4'>
        <div>{community.description}</div>
      </div>
    </div>
  );
};

export default CommunityBanner;
