import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/shared/HolyGrail';
import CommentSkeleton from '@/app/components/skeletons/CommentSkeleton';
import CommunityCardSkeleton from '@/app/components/skeletons/CommunityCardSkeleton';
import PostSkeleton from '@/app/components/skeletons/PostSkeleton';

export default function SearchPageLoading() {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='max-w-[700px] flex flex-col p-4 gap-4 w-full'>
          <PostSkeleton />
          <div className='flex flex-col gap-4'>
            {[...Array(2)].map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </div>
        </div>
      </Middle>
      <Right>
        <CommunityCardSkeleton />
      </Right>
    </HolyGrail>
  );
}
