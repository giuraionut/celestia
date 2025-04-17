import React from 'react';
import { HolyGrail, Left, Middle, Right } from '../shared/HolyGrail';
import { Skeleton } from '@/components/ui/skeleton';

const FormSkeleton = () => {
  return (
    <HolyGrail>
      <Left></Left>
      <Middle>
        <div className='flex flex-col gap-4 p-4 w-2/3 mx-auto'>
          <Skeleton className='w-1/2 h-8' />
          <Skeleton className='w-full h-8' />
          <Skeleton className='w-1/3 h-8' />
          <Skeleton className='w-3/ h-8' />
          <Skeleton className='w-1/2 h-8' />
          <Skeleton className='w-16 h-8' />
        </div>
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default FormSkeleton;
