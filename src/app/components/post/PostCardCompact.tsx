import React from 'react';
import Image from 'next/image';
import { ExtendedPost } from '@prisma/client';
import { cn, shortenText } from '@/lib/utils';

interface PostCardCompactProps {
  post: ExtendedPost;
  className?: string;
}

const PostCardCompact = ({ post, className }: PostCardCompactProps) => {
  const imageSrc = post.cover;

  return (
    <article className={cn('flex items-start gap-3', className)}>
      <div className='flex-1 min-w-0'>
        <h1 className='text-base font-medium leading-tight'>
          {shortenText(post.title, 80)}
        </h1>
        {!imageSrc && post.content && (
          <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
            {shortenText(post.content, 100)}
          </p>
        )}
      </div>
      {imageSrc && (
        <div className='relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded border bg-muted'>
          <Image
            src={imageSrc}
            alt={`Thumbnail for ${post.title}`}
            fill
            sizes='(max-width: 640px) 64px, 80px'
            className='object-cover'
          />
        </div>
      )}
    </article>
  );
};

export default PostCardCompact;
