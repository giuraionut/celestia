import { ExtendedComment } from '@prisma/client';
import React from 'react';
import { jsonToHtml } from '../tiptap/utils';
import { Card } from '@/components/ui/card';

const CommentCard = ({ comment }: { comment: ExtendedComment }) => {
  return (
    <Card className='flex flex-col gap-2 p-4 items-start'>
      <div className='flex gap-4 items-center'>
        <div>{comment.author?.name}</div>
        <div>{comment.createdAt.toDateString()}</div>
      </div>
      <div
        className='tiptap'
        dangerouslySetInnerHTML={{
          __html: jsonToHtml(comment.content),
        }}
      />
      <div>{comment.totalUpvotes - comment.totalDownvotes}</div>
    </Card>
  );
};

export default CommentCard;
