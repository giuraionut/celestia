import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import CommunityBannerSkeleton from '@/app/components/skeletons/CommunityBannerSkeleton';
import CommunityCardSkeleton from '@/app/components/skeletons/CommunityCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

const ManageCommunityPageLoading = () => {
  return (
    <HolyGrail>
      <Left></Left>
      <Middle>
        <div className='flex flex-col gap-4 w-full p-4'>
          <div className='w-full'>
            <CommunityBannerSkeleton />
          </div>
          <div className='w-full flex flex-col gap-4 border rounded-lg p-4'>
            <Skeleton className='h-16 w-1/4' />
            <Skeleton className='h-8 w-1/6' />
            <Skeleton className='h-8 w-1/6' />
            {Array.from({ length: 2 }).map((_, i) => (
              <div className='flex flex-row items-center gap-4' key={i}>
                <Skeleton className='h-8 w-8 shrink-0 rounded-full' />
                <Skeleton className='h-8 w-full' />
              </div>
            ))}
          </div>
        </div>
      </Middle>
      <Right>
        <CommunityCardSkeleton />
      </Right>
    </HolyGrail>
  );
};

export default ManageCommunityPageLoading;
