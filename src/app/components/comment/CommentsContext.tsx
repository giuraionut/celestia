// CommentsContext.tsx
'use client';
import React, {
  createContext,
  startTransition,
  useContext,
  useState,
} from 'react';
import { useOptimistic } from 'react';
import { ExtendedComment } from '@prisma/client';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

type CommentCountAction = { type: 'ADD_COMMENT' } | { type: 'DELETE_COMMENT' };

const totalCommentsReducer = (
  state: number,
  action: CommentCountAction
): number => {
  switch (action.type) {
    case 'ADD_COMMENT':
      return state + 1;
    case 'DELETE_COMMENT':
      return state - 1;
    default:
      return state;
  }
};

export interface CommentsContextType {
  totalComments: number;
  comments: ExtendedComment[];
  incrementCommentCount: () => void;
  decrementCommentCount: () => void;
  updateCommentInTree: (updatedComment: ExtendedComment) => void;
  addComment: (comment: ExtendedComment) => void;
  appendComments: (newComments: ExtendedComment[]) => void;
  session: Session | null;
  sessionStatus: 'loading' | 'unauthenticated' | 'authenticated';
}

interface CommentsProviderProps {
  initialCount: number;
  initialComments: ExtendedComment[];
  children: React.ReactNode;
}

export const CommentsContext = createContext<CommentsContextType | undefined>(
  undefined
);

export const CommentsProvider = ({
  initialCount,
  initialComments,
  children,
}: CommentsProviderProps) => {
  // Optimistic state for total comments
  const [totalComments, setTotalComments] = useOptimistic(
    initialCount,
    totalCommentsReducer
  );
  // Regular state for the comments list
  const [comments, setComments] = useState<ExtendedComment[]>(initialComments);
  const { data: session, status: sessionStatus } = useSession();
  const incrementCommentCount = () => {
    startTransition(() => {
      setTotalComments({ type: 'ADD_COMMENT' });
    });
  };

  const decrementCommentCount = () => {
    startTransition(() => {
      setTotalComments({ type: 'DELETE_COMMENT' });
    });
  };

  const updateCommentRecursively = (
    comments: ExtendedComment[],
    updatedComment: ExtendedComment
  ): ExtendedComment[] => {
    return comments.map((comment) => {
      if (comment.id === updatedComment.id) {
        return updatedComment;
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentRecursively(comment.replies, updatedComment),
        };
      }
      return comment;
    });
  };

  const updateCommentInTree = (updatedComment: ExtendedComment) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === updatedComment.id
          ? updatedComment
          : comment.replies && comment.replies.length > 0
          ? {
              ...comment,
              replies: updateCommentRecursively(
                comment.replies,
                updatedComment
              ),
            }
          : comment
      )
    );
  };

  const addComment = (comment: ExtendedComment) => {
    setComments((prev) => [...prev, comment]);
    startTransition(() => {
      setTotalComments({ type: 'ADD_COMMENT' });
    });
  };
  // For load-more: simply append new comments without modifying the optimistic total
  const appendComments = (newComments: ExtendedComment[]) => {
    startTransition(() => {
      setComments((prev) => [...prev, ...newComments]);
    });
  };

  return (
    <CommentsContext.Provider
      value={{
        totalComments,
        comments,
        incrementCommentCount,
        decrementCommentCount,
        updateCommentInTree,
        addComment,
        appendComments,
        session,
        sessionStatus,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
};

export const useCommentsContext = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error(
      'useCommentsContext must be used within a CommentsProvider'
    );
  }
  return context;
};
