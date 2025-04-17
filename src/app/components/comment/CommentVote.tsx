'use client';
import { cn } from '@/lib/utils';
import type { ExtendedComment, Vote } from '@prisma/client';
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  startTransition,
} from 'react';
import { LoginDialog } from '../shared/LoginDialog';
import { deleteCommentVote, voteOnComment } from '@/actions/commentVoteActions';
import { useCommentsContext } from './CommentsContext';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <T extends (...args: any[]) => unknown>( // Use any[] in constraint
  fn: T,
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | undefined;

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

interface OptimisticVoteState {
  count: number;
  voteType: Vote['type'] | null;
  voteId: string | null;
}

const CommentVote = ({
  comment,
  vote,
}: {
  comment: ExtendedComment;
  vote: Vote | null;
}) => {
  const { updateCommentInTree, session, sessionStatus } = useCommentsContext();

  const [optimisticVote, setOptimisticVote] = useState<OptimisticVoteState>({
    count: comment.totalUpvotes - comment.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  });

  const [isVoting, setIsVoting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const commentRef = useRef(comment);
  const optimisticVoteRef = useRef(optimisticVote);

  useEffect(() => {
    commentRef.current = comment;
    setOptimisticVote({
      count: comment.totalUpvotes - comment.totalDownvotes,
      voteType: vote ? vote.type : null,
      voteId: vote ? vote.id : null,
    });
  }, [comment, vote]);

  useEffect(() => {
    optimisticVoteRef.current = optimisticVote;
  }, [optimisticVote]);

  const handleVote = useCallback(
    async (type: 'UPVOTE' | 'DOWNVOTE') => {
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

      let upvoteDelta = 0;
      let downvoteDelta = 0;

      if (isSameVote) {
        if (type === 'UPVOTE') {
          upvoteDelta = -1;
        } else {
          downvoteDelta = -1;
        }
      } else if (isSwitchingVote) {
        if (type === 'UPVOTE') {
          upvoteDelta = 1;
          downvoteDelta = -1;
        } else {
          upvoteDelta = -1;
          downvoteDelta = 1;
        }
      } else {
        if (type === 'UPVOTE') {
          upvoteDelta = 1;
        } else {
          downvoteDelta = 1;
        }
      }
      const countChange = upvoteDelta - downvoteDelta;

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

      startTransition(async () => {
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

          setOptimisticVote((prev) => ({
            ...prev,
            voteId: newVoteIdFromServer,
          }));
          toast.success(
            isSameVote
              ? 'Vote removed!'
              : type === 'UPVOTE'
              ? 'Upvoted!'
              : 'Downvoted!',
            { id: toastId }
          );

          const finalVoteForContext: Vote | null = newVoteIdFromServer
            ? {
                id: newVoteIdFromServer,
                type: type,
                userId: currentUserId,
                commentId: baseComment.id,
                postId: baseComment.postId,
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
          setOptimisticVote({
            count:
              commentRef.current.totalUpvotes -
              commentRef.current.totalDownvotes,
            voteType: vote ? vote.type : null,
            voteId: vote ? vote.id : null,
          });
          toast.error('Vote failed. Please try again.', { id: toastId });
        } finally {
          setIsVoting(false);
        }
      });
    },
    [session?.user?.id, updateCommentInTree, vote]
  );
  type DebouncedVoteFn = typeof handleVote & { cancel: () => void };
  const debouncedVoteRef = useRef<DebouncedVoteFn | null>(null);

  useEffect(() => {
    debouncedVoteRef.current = debounce(handleVote, 300);
    return () => {
      debouncedVoteRef.current?.cancel();
    };
  }, [handleVote]);
  const triggerVote = useCallback(
    (type: 'UPVOTE' | 'DOWNVOTE') => {
      if (sessionStatus === 'unauthenticated') {
        setIsLoginModalOpen(true);
        return;
      }
      if (isVoting) {
        return;
      }
      debouncedVoteRef.current?.(type);
    },
    [isVoting, sessionStatus]
  );
  return (
    <div className='flex items-center gap-1'>
      <button
        onClick={() => triggerVote('UPVOTE')}
        disabled={isVoting || comment.isDeleted}
        aria-label='Upvote comment'
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
        disabled={isVoting || comment.isDeleted}
        aria-label='Downvote comment'
        className={cn(
          'p-1 rounded hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer',
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

export default CommentVote;
