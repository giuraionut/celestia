import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

const PostSkeleton = () => {
  return (
    <div className='max-w-[700px] w-full mx-auto flex flex-col gap-4 mb-4'>
      <div className='flex w-full gap-4 items-center'>
        <Skeleton className='h-12 w-12 rounded-full shrink-0' />
        <Skeleton className='h-8 w-1/3' />
      </div>
      <div className='flex flex-row justify-between'>
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-4 w-8' />
      </div>
      <Skeleton className='h-[500px] w-full rounded-lg' />
      <div className='flex flex-row justify-between'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-24' />
      </div>
    </div>
  );
};

export default PostSkeleton;
