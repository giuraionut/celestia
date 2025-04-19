'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSortContext } from '../post/PostSortingContext';

// Update the LoadMoreAction type to include userId
type LoadMoreAction = (options: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  userId?: string; // Add userId as an optional parameter
}) => Promise<readonly [React.ReactNode, string | null]>;

type LoadMoreProps = {
  children: React.ReactNode;
  loadMoreAction: LoadMoreAction;
  initialCursor?: string | null;
  userId?: string; // Add userId to the props type
};

export default function LoadMore({
  children,
  loadMoreAction,
  initialCursor,
  userId,
}: LoadMoreProps) {
  const { sortBy, sortOrder, isSortChanging, currentSort } = useSortContext();

  const [content, setContent] = useState<React.ReactNode[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Reset content when the sort changes or when initial children change
  useEffect(() => {
    setContent([children]);
    setCursor(initialCursor || null);
  }, [children, initialCursor, currentSort]);

  // Load more posts when the loading indicator comes into view
  useEffect(() => {
    const loadMore = async () => {
      if (!cursor || isPending || isSortChanging) return;

      setIsPending(true);
      try {
        const [newContent, nextCursor] = await loadMoreAction({
          cursor,
          sortBy,
          sortOrder,
          ...(userId ? { userId } : {}),
        });

        setContent((prev) => [...prev, newContent]);
        setCursor(nextCursor);
      } catch (error) {
        console.error('Error loading more posts:', error);
      } finally {
        setIsPending(false);
      }
    };

    if (inView) {
      loadMore();
    }
  }, [
    inView,
    cursor,
    isPending,
    loadMoreAction,
    sortBy,
    sortOrder,
    isSortChanging,
    userId,
  ]);

  // Loading indicator while sort is changing (initial load)
  if (isSortChanging) {
    return (
      <div className='w-full py-8 flex justify-center'>
        <div className='animate-spin h-8 w-8 border-2 border-gray-500 rounded-full border-t-transparent'></div>
      </div>
    );
  }

  return (
    <>
      {content}
      {cursor && (
        <div ref={ref} className='w-full h-16 flex items-center justify-center'>
          {isPending && (
            <div className='animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent'></div>
          )}
        </div>
      )}
    </>
  );
}
