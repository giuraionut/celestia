import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { cn } from '@/lib/utils';
const CommunityBannerSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'border rounded-lg flex flex-col w-full overflow-hidden',
        className
      )}
    >
      <div className='relative p-4 w-full bg-accent'>
        <div className='flex flex-col sm:flex-row sm:items-start gap-4'>
          {/* Image Skeleton */}
          <Skeleton className='w-20 h-20 rounded-full flex-shrink-0 mx-auto sm:mx-0' />

          {/* Text Content Skeleton Area */}
          <div className='flex flex-col flex-grow gap-2 w-full sm:w-auto mt-2 sm:mt-0'>
            <Skeleton className='h-6 w-3/4 sm:w-48' />
            <Skeleton className='h-4 w-1/2 sm:w-32' />
          </div>

          {/* Buttons Skeleton Area */}
          <div className='flex flex-row items-center sm:items-end gap-2 mt-2 sm:mt-0 sm:ml-auto flex-shrink-0 w-full sm:w-auto'>
            <Skeleton className='h-9 w-24' />
          </div>
        </div>
      </div>

      <div className='p-4 border-t'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-3/4' />
        </div>
      </div>
    </div>
  );
};

export default CommunityBannerSkeleton;
