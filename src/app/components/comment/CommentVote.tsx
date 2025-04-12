'use client';
import { cn } from '@/lib/utils';
// Assuming ExtendedComment includes votes, totalUpvotes, totalDownvotes, postId etc.
import type { ExtendedComment, Vote } from '@prisma/client'; // Adjust User import if needed
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LoginDialog } from '../shared/LoginDialog';
import { deleteCommentVote, voteOnComment } from '@/actions/commentVoteActions';
import { useCommentsContext } from './CommentsContext';
import { toast } from 'sonner';

// --- Debounce Utility (Corrected Constraint) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <T extends (...args: any[]) => unknown>( // Use any[] in constraint
  fn: T,
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | undefined;

  // Parameters<T> still provides type safety inside
  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  debouncedFn.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = undefined;
  };
  return debouncedFn as T & { cancel: () => void };
};
// --- End Debounce Utility ---

// Define the shape of the optimistic state
interface OptimisticVoteState {
  count: number;
  voteType: Vote['type'] | null;
  voteId: string | null;
}

const CommentVote = ({
  comment,
  vote, // The initial vote state for this user for this comment
}: {
  comment: ExtendedComment;
  vote: Vote | null;
}) => {
  const { updateCommentInTree, session, sessionStatus } = useCommentsContext();

  // State for optimistic UI updates
  const [optimisticVote, setOptimisticVote] = useState<OptimisticVoteState>({
    count: comment.totalUpvotes - comment.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  });

  // State for loading/disabling buttons during API call
  const [isVoting, setIsVoting] = useState(false);
  // State for login modal visibility
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // --- Refs for accessing latest values inside useCallback/debounce ---
  const commentRef = useRef(comment);
  const optimisticVoteRef = useRef(optimisticVote);

  // Keep refs updated whenever their source state/props change
  useEffect(() => {
    commentRef.current = comment;
    // Update optimistic state directly ONLY when the comment/vote props change externally
    setOptimisticVote({
      count: comment.totalUpvotes - comment.totalDownvotes,
      voteType: vote ? vote.type : null,
      voteId: vote ? vote.id : null,
    });
  }, [comment, vote]);

  useEffect(() => {
    // Keep the optimisticVoteRef synced with the state
    optimisticVoteRef.current = optimisticVote;
  }, [optimisticVote]);
  // --- End Refs Setup ---

  // --- Core Voting Logic (Memoized) ---
  // handleVote is async, so it returns Promise<void>
  const handleVote = useCallback(
    async (type: 'UPVOTE' | 'DOWNVOTE') => {
      // Use refs to get the *latest* base comment and optimistic state values
      const baseComment = commentRef.current;
      const currentOptimisticState = optimisticVoteRef.current;
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        console.error('User session not found in handleVote');
        setIsLoginModalOpen(true);
        return;
      }

      const isSameVote = currentOptimisticState.voteType === type;
      const isSwitchingVote =
        currentOptimisticState.voteType &&
        currentOptimisticState.voteType !== type;

      // Calculate vote count deltas
      let upvoteDelta = 0;
      let downvoteDelta = 0;

      if (isSameVote) {
        // Replace ternary with if/else
        if (type === 'UPVOTE') {
          upvoteDelta = -1;
        } else {
          downvoteDelta = -1;
        }
      } else if (isSwitchingVote) {
        // This block already uses if/else, which is fine
        if (type === 'UPVOTE') {
          upvoteDelta = 1;
          downvoteDelta = -1;
        } else {
          upvoteDelta = -1;
          downvoteDelta = 1;
        }
      } else {
        // New vote
        // Replace ternary with if/else
        if (type === 'UPVOTE') {
          upvoteDelta = 1;
        } else {
          downvoteDelta = 1;
        }
      }
      const countChange = upvoteDelta - downvoteDelta;

      // Optimistic UI Update
      const newOptimisticState: OptimisticVoteState = {
        count: currentOptimisticState.count + countChange,
        voteType: isSameVote ? null : type,
        voteId: currentOptimisticState.voteId,
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

        if (isSameVote && currentOptimisticState.voteId) {
          await deleteCommentVote(
            baseComment.id,
            currentOptimisticState.voteId
          );
        } else {
          if (isSwitchingVote && currentOptimisticState.voteId) {
            await deleteCommentVote(
              baseComment.id,
              currentOptimisticState.voteId
            );
          }
          const createdVote = await voteOnComment(baseComment.id, type);
          if (!createdVote || !createdVote.id) {
            throw new Error('Failed to create vote on server.');
          }
          newVoteIdFromServer = createdVote.id;
        }

        // Update Optimistic State with new ID
        setOptimisticVote((prev) => ({ ...prev, voteId: newVoteIdFromServer }));
        toast.success(
          isSameVote
            ? 'Vote removed!'
            : type === 'UPVOTE'
            ? 'Upvoted!'
            : 'Downvoted!',
          { id: toastId }
        );

        // Update Context
        const finalVoteForContext: Vote | null = newVoteIdFromServer
          ? {
              id: newVoteIdFromServer,
              type: type,
              userId: currentUserId,
              commentId: baseComment.id,
              postId: baseComment.postId, // Ensure postId exists on ExtendedComment
            }
          : null;
        const updatedVotesForContext = (baseComment.votes || []).filter(
          (v) => v.userId !== currentUserId
        );
        if (finalVoteForContext)
          updatedVotesForContext.push(finalVoteForContext);
        const updatedCommentForContext: ExtendedComment = {
          ...baseComment,
          totalUpvotes: baseComment.totalUpvotes + upvoteDelta,
          totalDownvotes: baseComment.totalDownvotes + downvoteDelta,
          votes: updatedVotesForContext,
        };
        updateCommentInTree(updatedCommentForContext);
      } catch (error) {
        console.error('Vote failed:', error);
        // Rollback optimistic UI
        setOptimisticVote({
          count:
            commentRef.current.totalUpvotes - commentRef.current.totalDownvotes,
          voteType: vote ? vote.type : null,
          voteId: vote ? vote.id : null,
        });
        toast.error('Vote failed. Please try again.', { id: toastId });
      } finally {
        setIsVoting(false);
      }
    },
    [
      session?.user?.id,
      updateCommentInTree,
      vote,
      // Refs are stable, state accessed via refs inside
    ]
  );
  type DebouncedVoteFn = typeof handleVote & { cancel: () => void };
  const debouncedVoteRef = useRef<DebouncedVoteFn | null>(null);

  useEffect(() => {
    debouncedVoteRef.current = debounce(handleVote, 300);
    return () => {
      debouncedVoteRef.current?.cancel();
    };
  }, [handleVote]); // Dependency is the memoized handleVote
  // --- End Debounced Function Setup ---

  // --- Trigger Function ---
  const triggerVote = useCallback(
    (type: 'UPVOTE' | 'DOWNVOTE') => {
      if (sessionStatus === 'unauthenticated') {
        setIsLoginModalOpen(true);
        return;
      }
      if (isVoting) {
        return; // Ignore clicks while voting
      }
      debouncedVoteRef.current?.(type); // Call the debounced function
    },
    [isVoting, sessionStatus]
  );
  // --- End Trigger Function ---

  // --- Render ---
  return (
    <div className='flex items-center gap-1'>
      <button
        onClick={() => triggerVote('UPVOTE')}
        disabled={isVoting || comment.isDeleted}
        aria-label='Upvote comment'
        className='p-0.5 rounded hover:bg-accent disabled:opacity-50'
      >
        <ChevronUp
          size={18}
          className={cn(
            'stroke-current text-muted-foreground transition-colors duration-150',
            {
              'text-blue-500 fill-blue-500/30':
                optimisticVote.voteType === 'UPVOTE',
              'hover:text-primary':
                !isVoting && optimisticVote.voteType !== 'UPVOTE',
            }
          )}
        />
      </button>

      <span
        className={cn('text-sm font-medium min-w-[1.5rem] text-center', {
          'text-blue-600': optimisticVote.voteType === 'UPVOTE',
          'text-red-600': optimisticVote.voteType === 'DOWNVOTE',
          'text-muted-foreground': optimisticVote.voteType === null,
          'animate-pulse': isVoting,
        })}
      >
        {optimisticVote.count}
      </span>

      <button
        onClick={() => triggerVote('DOWNVOTE')}
        disabled={isVoting || comment.isDeleted}
        aria-label='Downvote comment'
        className='p-0.5 rounded hover:bg-accent disabled:opacity-50'
      >
        <ChevronDown
          size={18}
          className={cn(
            'stroke-current text-muted-foreground transition-colors duration-150',
            {
              'text-red-500 fill-red-500/30':
                optimisticVote.voteType === 'DOWNVOTE',
              'hover:text-primary':
                !isVoting && optimisticVote.voteType !== 'DOWNVOTE',
            }
          )}
        />
      </button>

      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default CommentVote;
