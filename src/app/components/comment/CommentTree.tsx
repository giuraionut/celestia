'use client';
import { CommentNode } from './CommentNode';
import { isLastChild as checkIsLastChild } from './commentTreeUtils';
import { ExtendedComment } from '@prisma/client';

interface CommentTreeProps {
  comments: ExtendedComment[];
  path?: number[];
  updateCommentInTree: (updatedComment: ExtendedComment) => void;
}
// A recursive function to update a comment anywhere in the tree

export const CommentTree = ({
  comments,
  path = [],
  updateCommentInTree,
}: CommentTreeProps) => {
  // Update a comment anywhere in the tree recursively

  return (
    <>
      {comments.map((comment, index) => {
        const currentPath = [...path, index];
        const lastChild = checkIsLastChild(index, comments);
        return (
          <ul key={comment.id}>
            <CommentNode
              comment={comment}
              path={currentPath}
              index={index}
              isLastChild={lastChild}
              hasParent={comment.parentId !== null}
              isParent={comment.replies && comment.replies.length > 0}
              updateCommentInTree={updateCommentInTree} // pass updater to node
            />
          </ul>
        );
      })}
    </>
  );
};
