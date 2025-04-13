'use client';
import { cn } from '@/lib/utils';
import { ExtendedPost, Vote } from '@prisma/client';
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LoginDialog } from '../shared/LoginDialog';
import { deletePostVote, voteOnPost } from '@/actions/postVoteActions';
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

  return debouncedFn as DebouncedFunction<T>;
};

type VoteFn = (type: 'UPVOTE' | 'DOWNVOTE') => void;

const PostVote = ({
  post,
  vote,
  userId,
}: {
  post: ExtendedPost;
  vote: Vote | null;
  userId: string | null;
}) => {
  const [optimisticVote, setOptimisticVote] = useState({
    count: post.totalUpvotes - post.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  });

  const [isVoting, setIsVoting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const originalDataRef = useRef({
    count: post.totalUpvotes - post.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  });

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
  }, [post.totalUpvotes, post.totalDownvotes, vote]);

  const handleVote = useCallback(
    async (type: 'UPVOTE' | 'DOWNVOTE') => {
      if (!userId) {
        setIsLoginModalOpen(true);
        return;
      }
      if (isVoting) return;
      const previousOptimisticState = { ...optimisticVote };

      const isSameVote = optimisticVote.voteType === type;
      const isSwitchingVote =
        optimisticVote.voteType && optimisticVote.voteType !== type;

      let countChange = 0;
      if (isSameVote) {
        countChange = type === 'UPVOTE' ? -1 : 1;
      } else if (isSwitchingVote) {
        countChange = type === 'UPVOTE' ? 2 : -2;
      } else {
        countChange = type === 'UPVOTE' ? 1 : -1;
      }

      const newOptimisticState = {
        count: previousOptimisticState.count + countChange,
        voteType: isSameVote ? null : type,
        voteId: previousOptimisticState.voteId,
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
        let newVoteIdFromServer: string | null = null;

        if (isSameVote && previousOptimisticState.voteId) {
          await deletePostVote(post.id, previousOptimisticState.voteId);
          toast.success('Vote removed!', { id: toastId });
        } else {
          if (isSwitchingVote && previousOptimisticState.voteId) {
            await deletePostVote(post.id, previousOptimisticState.voteId);
          }

          const newVoteResult = await voteOnPost(post.id, type);
          if (newVoteResult) {
            newVoteIdFromServer =
              typeof newVoteResult === 'object' && newVoteResult?.id
                ? newVoteResult.id
                : typeof newVoteResult === 'string'
                ? newVoteResult
                : null;
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
      } catch (error) {
        console.error('Vote failed:', error);
        setOptimisticVote(previousOptimisticState);
        toast.error('Something went wrong. Please try again.', { id: toastId });
      } finally {
        setIsVoting(false);
      }
    },
    [userId, isVoting, optimisticVote, post.id]
  );

  // Ref for the debounced function
  const debouncedVoteRef = useRef<DebouncedFunction<VoteFn> | null>(null);

  useEffect(() => {
    debouncedVoteRef.current = debounce(handleVote, 300);

    return () => {
      debouncedVoteRef.current?.cancel();
    };
  }, [handleVote]); // Dependency is the memoized handleVote
  const triggerVote = useCallback((type: 'UPVOTE' | 'DOWNVOTE') => {
    debouncedVoteRef.current?.(type);
  }, []);

  return (
    <div className={cn('flex items-center gap-1 sm:gap-2')}>
      <button
        onClick={() => triggerVote('UPVOTE')}
        disabled={isVoting || post.isDeleted}
        aria-label='Upvote'
        className={cn(
          'p-1 rounded hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer',
          optimisticVote.voteType === 'UPVOTE'
            ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/50'
            : 'text-primary/60 hover:text-blue-500'
        )}
      >
        <ChevronUp
          size={20}
          className={cn(
            isVoting && optimisticVote.voteType !== 'UPVOTE'
              ? 'animate-pulse'
              : ''
          )}
        />
      </button>
      <span className='font-medium text-sm min-w-[20px] text-center tabular-nums'>
        {optimisticVote.count}
      </span>
      <button
        onClick={() => triggerVote('DOWNVOTE')}
        disabled={isVoting || post.isDeleted}
        aria-label='Downvote'
        className={cn(
          'p-1 rounded hover:bg-accent transition-colors disabled:opacity-50  cursor-pointer',
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
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default PostVote;
