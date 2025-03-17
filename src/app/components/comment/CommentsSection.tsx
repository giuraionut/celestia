// CommentsSection.tsx
'use client';
import { ExtendedComment, ExtendedPost } from '@prisma/client';
import React from 'react';
import { useCurrentPath } from './commentUtils';
import Link from 'next/link';
import { CommentTree } from './CommentTree';
import { CommentTreeProvider } from './CommentTreeContext';
import CreateComment from './CreateComment';
import { useCommentsContext } from './CommentsContext';

const CommentsSection = ({ post }: { post: ExtendedPost }) => {
  const { isFullDiscussion, baseUrl, currentCommentId } = useCurrentPath();
  const { comments, updateCommentInTree, addComment } = useCommentsContext();

  const currentComment = comments.find(
    (comment) => comment.id === currentCommentId
  );

  return (
    <>
      <CreateComment post={post} updateTree={addComment} />

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
            comments={comments}
            updateCommentInTree={updateCommentInTree}
          />
        </div>
      </CommentTreeProvider>
    </>
  );
};

export default CommentsSection;
