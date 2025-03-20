'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSortContext } from './PostSortingContext';

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

export default function LoadMorePosts({
  children,
  loadMoreAction,
  initialCursor,
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
      }
    };
    
    if (inView) {
      loadMore();
    }
  }, [inView, cursor, isPending, loadMoreAction, sortBy, sortOrder, isSortChanging]);
  
  // Loading indicator while sort is changing (initial load)
  if (isSortChanging) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <>
      {content}
      {cursor && (
        <div ref={ref} className="w-full h-16 flex items-center justify-center">
          {isPending && (
            <div className="animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          )}
        </div>
      )}
    </>
  );
}