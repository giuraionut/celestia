'use client';
import { MessageSquare } from 'lucide-react';
import React from 'react';
import { useCommentsContext } from './CommentsContext';



const PostCommentsCount = () => {
  const optimisticTotalComments = useCommentsContext();
  return (
    <div className='flex items-center gap-2'>
      <span>{optimisticTotalComments.totalComments}</span>
      <MessageSquare />
    </div>
  );
};

export default PostCommentsCount;
