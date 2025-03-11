// app/search/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchPageLoading() {
  return (
    <div className='flex flex-col md:flex-row h-screen w-full '>
      {/* Left Sidebar (hidden on mobile) */}
      <aside className='hidden md:flex md:flex-[0.5]'>
        <div className='text-center'>
          <Skeleton className='h-48 w-full mx-auto rounded-md' />
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 border-l border-r'>
        <div className='max-w-3xl w-full mx-auto p-4 flex flex-col gap-4'>
          <div className='flex-1 flex flex-col gap-2 justify-between'>
            {/* Community image and name skeleton */}
            <div className='flex items-center gap-2'>
              <Skeleton className='w-8 h-8 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
            {/* Post title skeleton */}
            <Skeleton className='h-8 w-full' />
            {/* Stats skeleton */}
            <Skeleton className='h-2 w-64' />
          </div>
          <div className='text-center'>
            <Skeleton className='h-72 w-full mx-auto rounded-md' />
          </div>
          <div className='border rounded-md h-32 gap-4 p-4 flex justify-between flex-col'>
            <Skeleton className='h-full w-full' />
            <div className='flex gap-4 items-center h-8'>
              <Skeleton className='h-8 w-5/6' />
              <Skeleton className='h-8 w-1/6' />
            </div>
          </div>
          <div className='flex flex-col gap-4'>
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className='flex justify-between items-center h-30 p-4 border rounded-md shadow-sm'
              >
                <div className='flex-1 flex flex-col gap-2 justify-between'>
                  {/* Community image and name skeleton */}
                  <div className='flex items-center gap-2'>
                    <Skeleton className='w-8 h-8 rounded-full' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  {/* Post title skeleton */}
                  <Skeleton className='h-6 w-3/4' />
                  {/* Stats skeleton */}
                  <Skeleton className='h-4 w-1/2' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Right Sidebar (hidden on mobile) */}
      <aside className='hidden md:flex md:flex-[0.5]'>
        <div className='sticky top-0 w-full p-4'>
          <div className='text-center'>
            <Skeleton className='h-48 w-full mx-auto rounded-md' />
          </div>
        </div>
      </aside>
    </div>
  );
}
