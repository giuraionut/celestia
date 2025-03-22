import { ExtendedComment } from '@prisma/client';
import React from 'react';
import { jsonToHtml } from '../tiptap/utils';

const CommentCard = ({ comment }: { comment: ExtendedComment }) => {
  return (
    <div className='flex flex-col gap-2 p-4 items-start border rounded-md w-full container cursor-pointer'>
      <div className='flex gap-4 items-center text-xs'>
        <div>{comment.createdAt.toDateString()}</div>
      </div>
      <div
        className='tiptap'
        dangerouslySetInnerHTML={{
          __html: jsonToHtml(comment.content),
        }}
      />
      
      <div>{comment.totalUpvotes - comment.totalDownvotes}</div>
    </div>
  );
};

export default CommentCard;
