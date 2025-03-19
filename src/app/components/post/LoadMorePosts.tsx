'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSortContext } from './PostSortingContext';
import { useSearchParams } from 'next/navigation';

type LoadMoreAction = (options: {
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}) => Promise<readonly [React.ReactNode, string | null]>;

type LoadMoreProps = {
  children: React.ReactNode;
  loadMoreAction: LoadMoreAction;
  initialCursor?: string | null;
};

export default function LoadMore({
  children,
  loadMoreAction,
  initialCursor,
}: LoadMoreProps) {
  const { sortBy, sortOrder, isLoading, setIsLoading } = useSortContext();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort') || 'newest';

  const [content, setContent] = useState<React.ReactNode[]>([children]);
  const [cursor, setCursor] = useState<string | null>(initialCursor || null);
  const [isPending, setIsPending] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Reset when URL sort parameter changes
  const prevSortParam = useRef(sortParam);
  useEffect(() => {
    if (sortParam !== prevSortParam.current) {
      console.log('Sort changed in URL, resetting content');
      setContent([children]);
      setCursor(initialCursor ?? null);
      prevSortParam.current = sortParam;
    }
  }, [sortParam, children, initialCursor]);

  // Load more posts when the loading indicator comes into view
  useEffect(() => {
    const loadMore = async () => {
      if (!cursor || isPending) return;

      setIsPending(true);
      try {
        console.log('Loading more with params:', { cursor, sortBy, sortOrder });
        const [newContent, nextCursor] = await loadMoreAction({
          cursor,
          sortBy,
          sortOrder,
        });

        setContent((prev) => [...prev, newContent]);
        setCursor(nextCursor);
      } catch (error) {
        console.error('Error loading more posts:', error);
      } finally {
        setIsPending(false);
        setIsLoading(false);
      }
    };

    if (inView) {
      loadMore();
    }
  }, [inView, cursor, isPending, loadMoreAction, sortBy, sortOrder]);

  return (
    <>
      {!isLoading && content}
      {~isLoading && cursor && (
        <div ref={ref} className='w-full h-16 flex items-center justify-center'>
          {isPending && (
            <div className='animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent'></div>
          )}
        </div>
      )}
    </>
  );
}
