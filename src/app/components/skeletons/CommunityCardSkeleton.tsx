import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const CommunityCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className='p-4 w-full'>
      <Card
        className={cn(
          'border rounded-lg p-4 shadow-sm flex flex-col gap-3 bg-card w-full',
          className
        )}
      >
        <div className='flex items-center gap-3'>
          <Skeleton className='h-10 w-10 rounded-full flex-shrink-0' />
          <Skeleton className='h-5 w-2/5' />
        </div>

        <div className='space-y-2 mt-1'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-11/12' />
          <Skeleton className='h-4 w-5/6' />
        </div>

        <div className='mt-3 pt-3 border-t'>
          <Skeleton className='h-9 w-24' />
        </div>
      </Card>
    </div>
  );
};

export default CommunityCardSkeleton;
