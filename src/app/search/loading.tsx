// app/search/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { HolyGrail, Left, Middle, Right } from '../components/shared/HolyGrail';

export default function SearchPageLoading() {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='flex flex-col gap-4 w-full max-w-[600px] p-4'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='flex justify-between items-center h-40 p-4 border rounded-sm shadow-sm'
            >
              <div className='flex-1 flex flex-col gap-2 justify-between'>
                {/* Community image and name skeleton */}
                <div className='flex items-center gap-2'>
                  <Skeleton className='w-6 h-6 rounded-full' />
                  <Skeleton className='h-4 w-32' />
                </div>
                {/* Post title skeleton */}
                <Skeleton className='h-6 w-3/4' />
                {/* Stats skeleton */}
                <Skeleton className='h-4 w-1/2' />
              </div>
              {/* Cover image skeleton */}
              <Skeleton className='w-32 h-full rounded-sm' />
            </div>
          ))}
        </div>
      </Middle>
      {/* Load More button skeleton */}
      <Right>
        <Skeleton className='h-48 w-full mx-auto rounded-sm m-4 top-14' />
      </Right>
    </HolyGrail>
  );
}
