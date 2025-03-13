'use client';
import { MessageSquare } from 'lucide-react';
import React from 'react';
import { useCommentsCount } from './CommentsCountContext';



const PostCommentsCount = () => {
  const comments = useCommentsCount();
  return (
    <div className='flex items-center gap-2'>
      <span>{comments.optimisticTotalComments}</span>
      <MessageSquare />
    </div>
  );
};

export default PostCommentsCount;
