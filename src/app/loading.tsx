// app/search/loading.tsx
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from './components/presentational/HolyGrail';

export default function SearchPageLoading() {
  return (
    <HolyGrail>
      <Left/>

      <Middle>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className='w-full max-w-[700px] mx-auto p-4 flex flex-col gap-2'
          >
            {/* Community image and name skeleton */}
            <div className='flex items-center gap-2'>
              <Skeleton className='w-8 h-8 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
            {/* Post title skeleton */}
            <Skeleton className='h-8 w-full' />
            {/* Stats skeleton */}
            <Skeleton className='h-2 w-64' />
            <Skeleton className='h-96 w-full mx-auto rounded-md' />
            <div className='flex flex-row justify-between'>
              <Skeleton className='h-2 w-32' />
              <Skeleton className='h-2 w-16' />
            </div>
            <Separator className='mt-4' />
          </div>
        ))}
      </Middle>

      {/* Right Sidebar (hidden on mobile) */}
      <Right>
        <Skeleton className='h-48 w-full mx-auto rounded-md m-4 top-14' />
      </Right>
    </HolyGrail>
  );
}
