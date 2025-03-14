'use client';

import { ExtendedComment } from '@prisma/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useCommentsContext } from '@/app/components/comment/CommentsCountContext'; // adjust path if needed

type LoadMoreProps = {
  children: React.ReactNode;
  loadMoreAction: (
    cursor?: string
  ) => Promise<[ExtendedComment[], string | null]>;
  initialCursor?: string | null;
};

export default function LoadMoreComments({
  children,
  loadMoreAction,
  initialCursor,
}: LoadMoreProps) {
  const { appendComments } = useCommentsContext();
  const [cursor, setCursor] = useState<string | null>(initialCursor || null);
  const [isPending, setIsPending] = useState(false);
  const initialRender = useRef(true);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Trigger when 200px away from view
  });

  const loadMore = useCallback(async () => {
    if (!cursor || isPending) return;

    setIsPending(true);
    try {
      const [newComments, nextCursor] = await loadMoreAction(cursor);
      appendComments(newComments);
      setCursor(nextCursor);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsPending(false);
    }
  }, [cursor, isPending, loadMoreAction, appendComments]);

  // Trigger loadMore when the element comes into view (skipping initial render)
  useEffect(() => {
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
      {children}
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
