import React from 'react';
import Image from 'next/image';
import { ExtendedPost } from '@prisma/client';
import { cn, shortenText } from '@/lib/utils';

interface PostCardProps {
  post: ExtendedPost;
  className?: string;
  compact?: boolean;
}

const PostCard = ({ post, className, compact }: PostCardProps) => {
  const imageSrc = post.cover || '/fallback-image.png';

  return (
    <article
      className={cn('flex flex-col gap-4 container', className, {
        'flex-row justify-between': compact,
      })}
    >
      {/* Header: Title & Author */}
      <header>
        <h1 className='text-lg font-bold'>{shortenText(post.title, 100)}</h1>
      </header>

      {/* Image Section */}
      {post.cover && (
        <div className='relative aspect-square  min-w-32 min-h-32 overflow-hidden rounded-sm ring'>
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
            className='object-contain h-full'
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
