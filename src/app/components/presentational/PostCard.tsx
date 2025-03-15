import React from 'react';
import Image from 'next/image';
import { ExtendedPost } from '@prisma/client';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: ExtendedPost;
  className?: string;
}

const PostCard = async ({ post, className }: PostCardProps) => {
  return (
    <article className={cn('flex flex-col gap-4 container', className)}>
      {/* Header: Title & Author */}
      <header>
        <h1 className='text-lg font-bold'>
          {post.title.length > 50
            ? post.title.slice(0, post.title.lastIndexOf(' ', 50)) + '...'
            : post.title}
        </h1>

        <p className='text-xs'>Posted by {post.author?.name}</p>
      </header>

      {/* Image Section */}
      <div className='relative w-full aspect-square overflow-hidden rounded-lg ring'>
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
          sizes='600px'
          className='object-contain'
        />
      </div>

      {/* Footer: Votes & Comments */}
    </article>
  );
};

export default PostCard;
