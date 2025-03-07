import { ExtendedPost } from '@prisma/client';
import React from 'react';

const PostComponent =  ({ post }: { post: ExtendedPost }) => {
  return (
    <div className='flex flex-col gap-4 border-1'>
      <div>{post.title}</div>
      <div>{post.author?.name}</div>
    </div>
  );
};

export default PostComponent;
