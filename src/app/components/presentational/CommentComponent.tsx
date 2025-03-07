import { ExtendedComment } from '@prisma/client';
import React from 'react';

const CommentComponent = ({ comment }: { comment: ExtendedComment }) => {
  return (
    <div className='border'>
      <div>{comment.author?.name}</div>
      <div></div>
      <div></div>
    </div>
  );
};

export default CommentComponent;
