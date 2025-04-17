'use client';
import {MessageSquareIcon } from 'lucide-react';
import React from 'react';
import { useCommentsContext } from './CommentsContext';



const PostCommentsCount = () => {
  const optimisticTotalComments = useCommentsContext();
  return (
    <div className='flex items-center gap-2 text-sm'>
      <span>{optimisticTotalComments.totalComments}</span>
      <MessageSquareIcon className='h-4 w-4' />
    </div>
  );
};

export default PostCommentsCount;
