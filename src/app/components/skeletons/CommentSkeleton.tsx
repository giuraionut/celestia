import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

const CommentSkeleton = () => {
  return (
    <Card className='flex flex-col w-full p-4 gap-4 border'>
      <div className='flex flex-row w-full gap-2 items-center'>
        <Skeleton className='h-10 w-10 rounded-full shrink-0' />
        <Skeleton className='h-4 w-1/2' />
      </div>
      <div className='flex flex-col gap-2 ml-16'>
        <Skeleton className='h-2 w-full' />
        <Skeleton className='h-2 w-full' />
        <Skeleton className='h-2 w-full' />
        <Skeleton className='h-2 w-full' />
      </div>
      <div className='flex flex-row ml-16 gap-4'>
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-4 w-8' />
        <Skeleton className='h-4 w-10' />
        <Skeleton className='h-4 w-10' />
      </div>
    </Card>
  );
};

export default CommentSkeleton;
