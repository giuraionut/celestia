import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import CommunityBannerSkeleton from '@/app/components/skeletons/CommunityBannerSkeleton';
import CommunityCardSkeleton from '@/app/components/skeletons/CommunityCardSkeleton';
import PostSkeleton from '@/app/components/skeletons/PostSkeleton';
import React from 'react';

const CommunityPageLoading = () => {
  return (
    <HolyGrail>
      <Left></Left>
      <Middle>
        <div className='flex px-4 flex-col gap-4 w-full'>
          <CommunityBannerSkeleton />
          <PostSkeleton />
        </div>
      </Middle>
      <Right>
        <CommunityCardSkeleton/>
      </Right>
    </HolyGrail>
  );
};

export default CommunityPageLoading;
