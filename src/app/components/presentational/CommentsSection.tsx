'use client';
import { ExtendedComment, ExtendedPost } from '@prisma/client';
import React, { startTransition, useOptimistic } from 'react';
import { useCurrentPath } from '../comment/commentUtils';
import Link from 'next/link';
import { CommentTree } from '../comment/CommentTree';
import { CommentTreeProvider } from '../comment/CommentTreeContext';
import CreateComment from '../comment/CreateComment';

interface CommentAction {
  type: 'UPDATE_COMMENT' | 'ADD_COMMENT';
  payload: ExtendedComment;
}

// Recursive helper: updates a comment anywhere in the tree
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

// Reducer for optimistic comments
const commentsReducer = (
  prev: ExtendedComment[],
  action: CommentAction
): ExtendedComment[] => {
  switch (action.type) {
    case 'UPDATE_COMMENT':
      return updateCommentRecursively(prev, action.payload);
    case 'ADD_COMMENT':
      return [...prev, action.payload];
    default:
      return prev;
  }
};

const CommentsSection = ({
  comments,
  post,
}: {
  comments: ExtendedComment[];
  post: ExtendedPost;
}) => {
  const { isFullDiscussion, baseUrl, currentCommentId } = useCurrentPath();
  
  // Use the reducer with useOptimistic
  const [optimisticComments, setOptimisticComments] = useOptimistic(
    comments,
    commentsReducer
  );

  // Updater function for updating a comment
  const updateCommentInTree = (updatedComment: ExtendedComment) => {
    console.log('update comment in tree', updatedComment.id);
    startTransition(() => {
      setOptimisticComments({ type: 'UPDATE_COMMENT', payload: updatedComment });
    });
  };

  // Updater function for adding a comment
  const updateTree = (comment: ExtendedComment) => {
    startTransition(() => {
      setOptimisticComments({ type: 'ADD_COMMENT', payload: comment });
    });
  };

  const currentComment = optimisticComments.find(
    (comment) => comment.id === currentCommentId
  );

  return (
    <>
      <CreateComment post={post} updateTree={updateTree} />

      <CommentTreeProvider>
        <div className='flex flex-col pl-4'>
          <div className='flex justify-between'>
            {!isFullDiscussion && (
              <Link href={baseUrl} className='ml-2'>
                See full discussion
              </Link>
            )}
            {currentComment?.parentId && (
              <Link href={`${baseUrl}/${currentComment.parentId}`}>
                Go to parent
              </Link>
            )}
          </div>
          <CommentTree
            comments={optimisticComments}
            updateCommentInTree={updateCommentInTree} // pass updater to nodes
          />
        </div>
      </CommentTreeProvider>
    </>
  );
};

export default CommentsSection;
