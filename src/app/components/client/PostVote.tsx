'use client';
import { deletePostVote, voteOnPost } from '@/actions/postVoteActions';
import { cn } from '@/lib/utils';
import { ExtendedPost, Vote } from '@prisma/client';
import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { startTransition, useOptimistic } from 'react';

// Define our optimistic vote state interface
interface VoteState {
  count: number;
  voteType: 'UPVOTE' | 'DOWNVOTE' | null;
}

// Define the actions for our reducer
type VoteAction = { type: 'TOGGLE_UPVOTE' } | { type: 'TOGGLE_DOWNVOTE' };

// Our reducer computes the new state based on the current state and the action.
// - If no vote exists and the user clicks upvote, add 1.
// - If user already upvoted and clicks upvote, remove it (-1).
// - If user had a downvote and clicks upvote, remove downvote and add upvote (+2).
// The same logic applies for downvote.
const voteReducer = (state: VoteState, action: VoteAction): VoteState => {
  switch (action.type) {
    case 'TOGGLE_UPVOTE':
      if (state.voteType === 'UPVOTE') {
        // Remove upvote
        return { count: state.count - 1, voteType: null };
      } else if (state.voteType === 'DOWNVOTE') {
        // Switch from downvote to upvote (net effect +2)
        return { count: state.count + 2, voteType: 'UPVOTE' };
      } else {
        // Add new upvote
        return { count: state.count + 1, voteType: 'UPVOTE' };
      }
    case 'TOGGLE_DOWNVOTE':
      if (state.voteType === 'DOWNVOTE') {
        // Remove downvote
        return { count: state.count + 1, voteType: null };
      } else if (state.voteType === 'UPVOTE') {
        // Switch from upvote to downvote (net effect -2)
        return { count: state.count - 2, voteType: 'DOWNVOTE' };
      } else {
        // Add new downvote
        return { count: state.count - 1, voteType: 'DOWNVOTE' };
      }
    default:
      return state;
  }
};

const PostVote = ({
  post,
  vote,
}: {
  post: ExtendedPost;
  vote: Vote | null;
}) => {
  // Initialize our optimistic vote state with the current count and vote type.
  const initialVoteState: VoteState = {
    count: post.totalUpvotes - post.totalDownvotes,
    voteType: vote ? vote.type : null,
  };

  // useOptimistic works like useState but with a reducer.
  const [optimisticVote, setOptimisticVote] = useOptimistic(
    initialVoteState,
    voteReducer
  );

  // Handler for upvoting
  const handleUpvote = async () => {
    console.log('UPVOTE');

    // Optimistically update the vote state.
    startTransition(() => {
      setOptimisticVote({ type: 'TOGGLE_UPVOTE' });
    });
    // If the user already upvoted, remove the vote.
    if (optimisticVote.voteType === 'UPVOTE') {
      await deletePostVote(post.id, vote!.id);
    } else {
      await voteOnPost(post.id, 'UPVOTE');
    }
  };

  // Handler for downvoting
  const handleDownvote = async () => {
    console.log('DOWNVOTE');
    startTransition(() => {
      setOptimisticVote({ type: 'TOGGLE_DOWNVOTE' });
    });
    if (optimisticVote.voteType === 'DOWNVOTE') {
      await deletePostVote(post.id, vote!.id);
    } else {
      await voteOnPost(post.id, 'DOWNVOTE');
    }
  };

  return (
    <div className='flex items-center gap-2'>
      <button onClick={handleUpvote}>
        <ChevronUp
         className={
          cn(`hover:text-primary text-primary/50 cursor-pointer`, { 'text-blue-500': optimisticVote.voteType === 'UPVOTE' })
        }
        />
      </button>
      <span>{optimisticVote.count}</span>
      <button onClick={handleDownvote}>
        <ChevronDown
          className={
            cn(`hover:text-primary text-primary/50 cursor-pointer`, { 'text-red-500': optimisticVote.voteType === 'DOWNVOTE' })
          }
        />
      </button>
    </div>
  );
};

export default PostVote;
