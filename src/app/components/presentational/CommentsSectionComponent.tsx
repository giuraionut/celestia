'use client'
import { ExtendedComment } from '@prisma/client';
import React, { useMemo } from 'react';
import { useCurrentPath } from '../comment/utils';
import { TreeProvider } from '../comment/TreeContext';
import Link from 'next/link';
import { CommentTree } from '../comment/CommentTree';

const CommentsSectionComponent = ({
  comments,
}: {
  comments: ExtendedComment[];
}) => {
  const { isFullDiscussion, baseUrl, currentCommentId } = useCurrentPath();
  const currentComment = useMemo(
    () => comments.find((comment) => comment.id === currentCommentId),
    [comments, currentCommentId]
  );

  return (
    <TreeProvider>
      <div className='flex flex-col p-8'>
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
        <CommentTree comments={comments} />
      </div>
    </TreeProvider>
  );
};

export default CommentsSectionComponent;
