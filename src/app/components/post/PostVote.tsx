'use client';
import { cn } from '@/lib/utils';
// Assuming ExtendedPost includes totalUpvotes, totalDownvotes properties
import { ExtendedPost, Vote } from '@prisma/client'; // Make sure Vote type is correctly imported if needed elsewhere, or remove if only type ('UPVOTE'/'DOWNVOTE') is used
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LoginDialog } from '../shared/LoginDialog';
import { deletePostVote, voteOnPost } from '@/actions/postVoteActions'; // Assuming these return necessary data or handle errors
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DebouncedFunction<T extends (...args: any[]) => void> = T & {
  cancel: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): DebouncedFunction<T> => {
  let timeoutId: NodeJS.Timeout | undefined;

  const debouncedFn = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  debouncedFn.cancel = () => {
    clearTimeout(timeoutId);
  };

  // Cast is safe here as we've added the cancel method
  return debouncedFn as DebouncedFunction<T>;
};

// Define the type for the vote function signature
type VoteFn = (type: 'UPVOTE' | 'DOWNVOTE') => void;

const PostVote = ({
  post,
  vote,
  userId,
}: {
  post: ExtendedPost;
  vote: Vote | null;
  userId: string | null; // Or use session status if available
}) => {
  // State for optimistic UI updates
  const [optimisticVote, setOptimisticVote] = useState({
    count: post.totalUpvotes - post.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  });

  const [isVoting, setIsVoting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Keep a ref to the original post/vote data for rollbacks if needed
  const originalDataRef = useRef({
    count: post.totalUpvotes - post.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  });

  // Update state and ref if the incoming post/vote props change
  useEffect(() => {
    const newCount = post.totalUpvotes - post.totalDownvotes;
    const newVoteType = vote ? vote.type : null;
    const newVoteId = vote ? vote.id : null;

    setOptimisticVote({
      count: newCount,
      voteType: newVoteType,
      voteId: newVoteId,
    });
    originalDataRef.current = {
      count: newCount,
      voteType: newVoteType,
      voteId: newVoteId,
    };
  }, [post.totalUpvotes, post.totalDownvotes, vote]); // More specific dependencies

  // Memoized vote handler function
  const handleVote = useCallback(
    async (type: 'UPVOTE' | 'DOWNVOTE') => {
      // Check authentication
      if (!userId) {
        setIsLoginModalOpen(true);
        return;
      }
      // Prevent concurrent actions
      if (isVoting) return;

      // Store current state before optimistic update for potential rollback
      const previousOptimisticState = { ...optimisticVote };

      const isSameVote = optimisticVote.voteType === type;
      const isSwitchingVote =
        optimisticVote.voteType && optimisticVote.voteType !== type;

      // Calculate change in display count
      let countChange = 0;
      if (isSameVote) {
        // Removing vote
        countChange = type === 'UPVOTE' ? -1 : 1;
      } else if (isSwitchingVote) {
        // Switching vote
        countChange = type === 'UPVOTE' ? 2 : -2;
      } else {
        // New vote
        countChange = type === 'UPVOTE' ? 1 : -1;
      }

      // --- Optimistic UI Update ---
      const newOptimisticState = {
        // Use previousOptimisticState.count as the base for calculation
        count: previousOptimisticState.count + countChange,
        voteType: isSameVote ? null : type,
        voteId: previousOptimisticState.voteId, // Keep current ID for potential deletion
      };
      setOptimisticVote(newOptimisticState);
      setIsVoting(true);

      const toastId = toast.loading(
        isSameVote
          ? 'Removing vote...'
          : isSwitchingVote
          ? 'Changing vote...'
          : 'Voting...'
      );

      try {
        // --- Perform Server Actions ---
        let newVoteIdFromServer: string | null = null; // Store only the ID if needed

        if (isSameVote && previousOptimisticState.voteId) {
          // Removing existing vote
          await deletePostVote(post.id, previousOptimisticState.voteId);
          toast.success('Vote removed!', { id: toastId });
        } else {
          // If switching votes, remove previous vote first
          if (isSwitchingVote && previousOptimisticState.voteId) {
            await deletePostVote(post.id, previousOptimisticState.voteId);
          }

          // Cast new vote - Assuming voteOnPost returns the new Vote object or its ID
          const newVoteResult = await voteOnPost(post.id, type);
          if (newVoteResult) {
            // Assuming newVoteResult has an 'id' property
            newVoteIdFromServer =
              typeof newVoteResult === 'object' && newVoteResult?.id
                ? newVoteResult.id
                : typeof newVoteResult === 'string'
                ? newVoteResult
                : null;
            // Update optimistic state ONLY with the new ID if successful and different
            if (
              newVoteIdFromServer &&
              newVoteIdFromServer !== previousOptimisticState.voteId
            ) {
              setOptimisticVote((prev) => ({
                ...prev,
                voteId: newVoteIdFromServer,
              }));
            }
            toast.success(
              type === 'UPVOTE'
                ? 'Upvoted successfully!'
                : 'Downvoted successfully!',
              { id: toastId }
            );
          } else {
            throw new Error('Failed to process vote on server.');
          }
        }

        // --- Potential Context/Parent Update (if needed) ---
        // If this component needs to inform a parent or context about the successful vote,
        // you would do it here. You might need the `newVoteIdFromServer` or calculate
        // the final vote counts based on the success.
        // Example: onVoteSuccess?.({ postId: post.id, newVoteState: ... });
      } catch (error) {
        console.error('Vote failed:', error);
        // --- Rollback optimistic UI on failure ---
        // Revert to the state before this specific vote attempt
        setOptimisticVote(previousOptimisticState);
        toast.error('Something went wrong. Please try again.', { id: toastId });
      } finally {
        setIsVoting(false);
      }
    },
    [
      // Dependencies for useCallback:
      userId,
      isVoting,
      optimisticVote, // Include the whole object or specific fields used
      post.id, // ID is needed for server actions
      // `vote` prop isn't directly used inside, but `optimisticVote` is derived from it initially.
      // Including optimisticVote covers changes derived from props.
    ]
  );

  // Ref for the debounced function
  const debouncedVoteRef = useRef<DebouncedFunction<VoteFn> | null>(null);

  // Effect to create and clean up the debounced function
  useEffect(() => {
    // Create debounced function based on the memoized handleVote
    debouncedVoteRef.current = debounce(handleVote, 300);

    // Cleanup function to cancel any pending calls when component unmounts or handleVote changes
    return () => {
      debouncedVoteRef.current?.cancel();
    };
  }, [handleVote]); // Dependency is the memoized handleVote

  // Stable function to trigger the debounced vote
  const triggerVote = useCallback((type: 'UPVOTE' | 'DOWNVOTE') => {
    // Call the debounced function if the ref is set
    debouncedVoteRef.current?.(type);
  }, []); // No dependencies as it only uses the stable ref

  return (
    <div className={cn('flex items-center gap-1 sm:gap-2')}>
      {' '}
      {/* Adjusted gap */}
      <button
        onClick={() => triggerVote('UPVOTE')}
        disabled={isVoting}
        aria-label='Upvote'
        className={cn(
          'p-1 rounded hover:bg-accent transition-colors disabled:opacity-50', // Base styles
          optimisticVote.voteType === 'UPVOTE'
            ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/50'
            : 'text-primary/60 hover:text-blue-500'
        )}
      >
        <ChevronUp
          size={20} // Slightly smaller icons can look cleaner
          className={cn(
            isVoting && optimisticVote.voteType !== 'UPVOTE'
              ? 'animate-pulse'
              : '' // Pulse only when processing this specific action
          )}
        />
      </button>
      <span className='font-medium text-sm min-w-[20px] text-center tabular-nums'>
        {' '}
        {/* Ensure number alignment */}
        {optimisticVote.count}
      </span>
      <button
        onClick={() => triggerVote('DOWNVOTE')}
        disabled={isVoting}
        aria-label='Downvote'
        className={cn(
          'p-1 rounded hover:bg-accent transition-colors disabled:opacity-50', // Base styles
          optimisticVote.voteType === 'DOWNVOTE'
            ? 'text-red-500 bg-red-100 dark:bg-red-900/50'
            : 'text-primary/60 hover:text-red-500'
        )}
      >
        <ChevronDown
          size={20}
          className={cn(
            isVoting && optimisticVote.voteType !== 'DOWNVOTE'
              ? 'animate-pulse'
              : ''
          )}
        />
      </button>
      {/* Render Login Dialog conditionally or manage its state */}
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default PostVote;
