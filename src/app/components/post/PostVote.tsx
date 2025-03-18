'use client';
import { deletePostVote, voteOnPost } from '@/actions/postVoteActions';
import { useAuth } from '@/app/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ExtendedPost, Vote } from '@prisma/client';
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { LoginDialog } from '../shared/LoginDialog';

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
}: {
  post: ExtendedPost;
  vote: Vote | null;
}) => {
  const initialVoteState = {
    count: post.totalUpvotes - post.totalDownvotes,
    voteType: vote ? vote.type : null,
    voteId: vote ? vote.id : null,
  };

  const [optimisticVote, setOptimisticVote] = useState(initialVoteState);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isVoting) return;

    const isSameVote = optimisticVote.voteType === type;
    const isSwitchingVote =
      optimisticVote.voteType && optimisticVote.voteType !== type;

    // Compute new vote state
    const newVoteState = {
      count:
        optimisticVote.count +
        (isSameVote
          ? -1
          : isSwitchingVote
          ? 2 * (type === 'UPVOTE' ? 1 : -1)
          : 1),
      voteType: isSameVote ? null : type,
      voteId: null, // Reset optimistically until backend confirms
    };

    flushSync(() => setOptimisticVote(newVoteState));
    setIsVoting(true);

    try {
      if (isSameVote && optimisticVote.voteId) {
        // Removing the existing vote
        await deletePostVote(post.id, optimisticVote.voteId);
        setOptimisticVote((prev) => ({ ...prev, voteId: null }));
      } else {
        // If switching votes, remove the previous vote first
        if (isSwitchingVote && optimisticVote.voteId) {
          await deletePostVote(post.id, optimisticVote.voteId);
        }
        // Cast new vote
        const newVote = await voteOnPost(post.id, type);
        if (newVote) {
          setOptimisticVote((prev) => ({ ...prev, voteId: newVote.id }));
        }
      }
    } catch (error) {
      console.error('Vote failed:', error);
      setOptimisticVote(initialVoteState); // Rollback on failure
    } finally {
      setIsVoting(false);
    }
  };

  const debouncedVote = useCallback(debounce(handleVote, 300), []);

  return (
    <div className='flex items-center gap-2'>
      <button onClick={() => debouncedVote('UPVOTE')} disabled={isVoting}>
        <ChevronUp
          className={cn('hover:text-primary text-primary/50 cursor-pointer', {
            'text-blue-500': optimisticVote.voteType === 'UPVOTE',
            'opacity-50': isVoting,
          })}
        />
      </button>
      <span>{optimisticVote.count}</span>
      <button onClick={() => debouncedVote('DOWNVOTE')} disabled={isVoting}>
        <ChevronDown
          className={cn('hover:text-primary text-primary/50 cursor-pointer', {
            'text-red-500': optimisticVote.voteType === 'DOWNVOTE',
            'opacity-50': isVoting,
          })}
        />
      </button>
      <LoginDialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default PostVote;
