'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

type LoadMoreProps = {
  children: React.ReactNode;
  loadMoreAction: (
    cursor?: string
  ) => Promise<readonly [React.ReactNode, string | null]>;
  initialCursor?: string | null;
};

export default function LoadMore({
  children,
  loadMoreAction,
  initialCursor,
}: LoadMoreProps) {
  const [content, setContent] = useState<React.ReactNode[]>([children]);
  const [cursor, setCursor] = useState<string | null>(initialCursor || null);
  const [isPending, setIsPending] = useState(false);
  const initialRender = useRef(true);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Load more when the element is 200px before coming into view
  });

  const loadMore = useCallback(async () => {
    if (!cursor || isPending) return;

    setIsPending(true);
    try {
      const [newContent, nextCursor] = await loadMoreAction(cursor);
      setContent((prev) => [...prev, newContent]);
      setCursor(nextCursor);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsPending(false);
    }
  }, [cursor, isPending, loadMoreAction]);

  // Trigger load more when the loading element comes into view
  useEffect(() => {
    // Skip initial render (avoid double loading)
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

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
