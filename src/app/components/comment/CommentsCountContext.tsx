// CommentsContext.tsx
'use client';
import React, {
  createContext,
  startTransition,
  useContext,
  useOptimistic,
  useState,
} from 'react';

interface CommentsContextType {
  optimisticTotalComments: number;
  incrementCommentCount: () => void;
  decrementCommentCount: () => void;
  setOptimisticTotalComments: (action: CommentAction) => void;
}

const CommentsContext = createContext<CommentsContextType | undefined>(
  undefined
);

type CommentAction = { type: 'ADD_COMMENT' } | { type: 'DELETE_COMMENT' };

const totalCommentsReducer = (state: number, action: CommentAction): number => {
  switch (action.type) {
    case 'ADD_COMMENT':
      return state + 1;
    case 'DELETE_COMMENT':
      return state - 1;
    default:
      return state;
  }
};

export const CommentsProvider = ({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) => {
  const [optimisticTotalComments, setOptimisticTotalComments] = useOptimistic(
    initialCount,
    totalCommentsReducer
  );

  const incrementCommentCount = () =>
    startTransition(() => {
      setOptimisticTotalComments({ type: 'ADD_COMMENT' });
    });
  const decrementCommentCount = () =>
    startTransition(() => {
      setOptimisticTotalComments({ type: 'DELETE_COMMENT' });
    });

  return (
    <CommentsContext.Provider
      value={{
        optimisticTotalComments,
        incrementCommentCount,
        decrementCommentCount,
        setOptimisticTotalComments,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
};

export const useCommentsCount = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};
