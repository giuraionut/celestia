import React from 'react';
import Image from 'next/image';
import { ExtendedPost } from '@prisma/client';
import { cn, shortenText } from '@/lib/utils';

interface PostCardProps {
  post: ExtendedPost;
  className?: string;
}

const PostCard = ({ post, className }: PostCardProps) => {
  const imageSrc = post.cover || '/fallback-image.png';
  const authorName = post.author?.name || 'Anonymous';

  return (
    <article className={cn('flex flex-col gap-4 container', className)}>
      {/* Header: Title & Author */}
      <header>
        <h1 className='text-lg font-bold'>{shortenText(post.title, 50)}</h1>
        <p className='text-xs'>Posted by {authorName}</p>
      </header>

      {/* Image Section */}
      {post.cover && (
        <div className='relative w-full aspect-square overflow-hidden rounded-lg ring'>
          {/* Blurred Background Image */}
          <Image
            src={imageSrc}
            alt={post.title}
            width={100}
            height={100}
            className='object-cover blur scale-110 w-full h-full'
            aria-hidden='true'
          />
          {/* Foreground Image */}
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            priority
            sizes='(max-width: 600px) 100vw, 600px'
            className='object-contain'
          />
        </div>
      )}
      {!post.cover && post.content && (
        <div>{shortenText(post.content, 100)}</div>
      )}
    </article>
  );
};

export default PostCard;
