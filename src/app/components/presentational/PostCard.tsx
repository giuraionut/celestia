import React from 'react';
import Image from 'next/image';
import { ExtendedPost, Vote } from '@prisma/client';
import PostVote from '../client/PostVote';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: ExtendedPost;
  className?: string;
}

const PostCard = async ({ post, className }: PostCardProps) => {
  return (
    <article className={cn('flex flex-col gap-4', className)}>
      {/* Header: Title & Author */}
      <header>
        <h1 className='text-lg font-bold'>{post.title}</h1>
        <p className='text-xs'>Posted by {post.author?.name}</p>
      </header>

      {/* Image Section */}
      <div className='relative w-full mx-auto aspect-square overflow-hidden rounded-lg'>
        {/* Blurred Background Image */}
        <Image
          src={post.cover}
          alt={post.title}
          width={100}
          height={100}
          className='object-cover blur scale-110 w-full h-full'
        />
        {/* Foreground Image */}
        <Image
          src={post.cover}
          alt={post.title}
          fill
          priority
          sizes='768px'
          className='object-contain'
        />
      </div>

      {/* Footer: Votes & Comments */}
      
    </article>
  );
};

export default PostCard;
