import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { HolyGrail, Left, Middle, Right } from '../shared/HolyGrail';
import PostSkeleton from './PostSkeleton';
import CommentSkeleton from './CommentSkeleton';

const UserPageSkeleton = ({
  type = 'posts',
}: {
  type?: 'comments' | 'posts';
}) => {
  const tabs = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <HolyGrail>
      <Left></Left>
      <Middle>
        <div className='flex w-full p-4 gap-4 items-center'>
          <Skeleton className='h-16 w-16 rounded-full shrink-0' />
          <Skeleton className='h-12 w-1/3' />
        </div>
        <div className='flex w-full p-4 gap-4 items-center'>
          {tabs.map((tab) => (
            <Skeleton key={tab} className='h-10 w-1/4' />
          ))}
        </div>
        <div className='flex flex-col w-full p-4 gap-4 items-center max-w-[700px] mx-auto'>
          {type === 'comments' ? <CommentSkeleton /> : <PostSkeleton />}
        </div>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default UserPageSkeleton;
