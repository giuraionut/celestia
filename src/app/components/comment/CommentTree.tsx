import { TreeNode } from './TreeNode';
import { isLastChild as checkIsLastChild } from './treeFunctions';
import { ExtendedComment } from '@prisma/client';

interface CommentTreeProps {
  comments: ExtendedComment[];
  path?: number[];
}

export const CommentTree = ({ comments, path = [] }: CommentTreeProps) => {
  console.log('comment Tree')
  return (
    <>
      {comments.map((comment, index) => {
        const currentPath = [...path, index];
        const lastChild = checkIsLastChild(index, comments);
        return (
          <ul key={comment.id}>
            <TreeNode
              comment={comment}
              path={currentPath}
              index={index}
              isLastChild={lastChild}
              hasParent={comment.parentId !== null}
              isParent={comment.replies && comment.replies.length > 0}
            />
          </ul>
        );
      })}
    </>
  );
};
