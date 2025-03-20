'use client';
import { cn } from '@/lib/utils';
import { ExtendedPost, Vote } from '@prisma/client';
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LoginDialog } from '../shared/LoginDialog';
import { deletePostVote, voteOnPost } from '@/actions/postVoteActions';
import { toast } from 'sonner';

// Utility function to debounce rapid clicks
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

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

  useEffect(() => {
    setOptimisticVote({
      count: post.totalUpvotes - post.totalDownvotes,
      voteType: vote ? vote.type : null,
      voteId: vote ? vote.id : null,
    });
  }, [post, vote]);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!userId) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isVoting) return;

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

    const newVoteState = {
      count: optimisticVote.count + countChange,
      voteType: isSameVote ? null : type,
      voteId: optimisticVote.voteId,
    };

    setOptimisticVote(newVoteState);
    setIsVoting(true);

    const toastId = toast.loading(
      isSameVote ? 'Removing vote...' : isSwitchingVote ? 'Changing vote...' : 'Voting...'
    );

    try {
      let newVoteObject: Vote | null = null;

      if (isSameVote && optimisticVote.voteId) {
        await deletePostVote(post.id, optimisticVote.voteId);
        newVoteObject = null;
        toast.success('Vote removed!', { id: toastId });
      } else {
        if (isSwitchingVote && optimisticVote.voteId) {
          await deletePostVote(post.id, optimisticVote.voteId);
        }

        const newVote = await voteOnPost(post.id, type);
        if (newVote) {
          setOptimisticVote((prev) => ({ ...prev, voteId: newVote.id }));
          newVoteObject = {
            id: newVote.id,
            type: type,
            userId: userId || '',
            postId: post.id,
            commentId: null,
          };
          toast.success(
            type === 'UPVOTE' ? 'Upvoted successfully!' : 'Downvoted successfully!',
            { id: toastId }
          );
        }
      }
    } catch (error) {
      console.error('Vote failed:', error);
      setOptimisticVote({
        count: post.totalUpvotes - post.totalDownvotes,
        voteType: vote ? vote.type : null,
        voteId: vote ? vote.id : null,
      });
      toast.error('Something went wrong. Please try again.', { id: toastId });
    } finally {
      setIsVoting(false);
    }
  };

  const debouncedVoteRef = useRef<(type: 'UPVOTE' | 'DOWNVOTE') => void>(() => {});

  useEffect(() => {
    debouncedVoteRef.current = debounce(handleVote, 300);
    return () => {
      if (debouncedVoteRef.current && (debouncedVoteRef.current as any).cancel) {
        (debouncedVoteRef.current as any).cancel();
      }
    };
  }, [handleVote]);

  const triggerVote = useCallback((type: 'UPVOTE' | 'DOWNVOTE') => {
    if (debouncedVoteRef.current) {
      debouncedVoteRef.current(type);
    }
  }, []);

  return (
    <div className={cn('flex items-center gap-2')}>
      <button onClick={() => triggerVote('UPVOTE')} disabled={isVoting}>
        <ChevronUp
          className={cn('text-primary/50 cursor-pointer', {
            'text-blue-500': optimisticVote.voteType === 'UPVOTE',
            'animate-pulse': isVoting,
            'hover:text-primary ': !isVoting,
          })}
        />
      </button>
      <span>{optimisticVote.count}</span>
      <button onClick={() => triggerVote('DOWNVOTE')} disabled={isVoting}>
        <ChevronDown
          className={cn('text-primary/50 cursor-pointer', {
            'text-red-500': optimisticVote.voteType === 'DOWNVOTE',
            'animate-pulse': isVoting,
            'hover:text-primary ': !isVoting,
          })}
        />
      </button>
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default PostVote;
