// app/search/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchPageLoading() {
  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center h-30 p-4 border rounded-md shadow-sm"
          >
            <div className="flex-1 flex flex-col gap-2 justify-between">
              {/* Community image and name skeleton */}
              <div className="flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              {/* Post title skeleton */}
              <Skeleton className="h-6 w-3/4" />
              {/* Stats skeleton */}
              <Skeleton className="h-4 w-1/2" />
            </div>
            {/* Cover image skeleton */}
            <Skeleton className="w-32 h-full rounded-md" />
          </div>
        ))}
      </div>
      {/* Load More button skeleton */}
      <div className="mt-6 text-center">
        <Skeleton className="h-8 w-32 mx-auto rounded" />
      </div>
    </div>
  );
}
