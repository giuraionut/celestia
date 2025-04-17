import { Skeleton } from '@/components/ui/skeleton';
import { HolyGrail, Left, Middle, Right } from '../components/shared/HolyGrail';
import PostSkeleton from '../components/skeletons/PostSkeleton';

export default function SearchPageLoading() {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='max-w-[700px] w-full flex flex-col items-center p-4 gap-4'>
          <div className='flex w-full items-center justify-between'>
            <Skeleton className='h-8 w-1/2' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-8' />
              <Skeleton className='h-8 w-8' />
            </div>
          </div>
          {[...Array(2)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </Middle>
      <Right>
        <Skeleton className='h-48 w-full mx-auto rounded-sm m-4 top-14' />
      </Right>
    </HolyGrail>
  );
}
