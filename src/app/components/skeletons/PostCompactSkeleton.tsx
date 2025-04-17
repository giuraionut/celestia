import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

const PostCompactSkeleton = () => {
  return (
    <Card className='flex flex-col w-full p-4 gap-4'>
      <div className='flex w-full gap-4 items-center'>
        <Skeleton className='h-12 w-12 rounded-full shrink-0' />
        <Skeleton className='h-8 w-1/3' />
      </div>
      <div className='flex flex-row justify-between'>
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='h-4 w-8' />
      </div>
      <div className='flex flex-row justify-between gap-4 w-full'>
        <div className='flex flex-col gap-2 w-full'>
          <Skeleton className='h-2 w-5/6' />
          <Skeleton className='h-2 w-3/4' />
          <Skeleton className='h-2 w-2/3' />
          <Skeleton className='h-2 w-1/2' />
          <Skeleton className='h-2 w-1/3' />
        </div>
        <Skeleton className='w-16 h-16 sm:w-20 sm:h-20 shrink-0' />
      </div>
      <div className='flex flex-row justify-between'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-24' />
      </div>
    </Card>
  );
};

export default PostCompactSkeleton;
