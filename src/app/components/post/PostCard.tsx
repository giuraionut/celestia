import React from 'react';
import Image from 'next/image';
import { ExtendedPost } from '@prisma/client';
import { cn, shortenText } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface PostCardProps {
  post: ExtendedPost;
  className?: string;
}

const PostCard = ({ post, className }: PostCardProps) => {
  const imageSrc = post.cover || '/fallback-image.png';

  return (
    <article className={cn('flex flex-col gap-4 container', className, {})}>
      <header>
        <h1 className='text-lg font-bold'>{shortenText(post.title, 100)}</h1>
      </header>

      {post.cover && (
        <Card className='relative aspect-square min-w-32 min-h-32 overflow-hidden ring'>
          <Image
            src={imageSrc}
            alt={post.title}
            width={100}
            height={100}
            className='object-cover blur scale-110 w-full h-full'
            aria-hidden='true'
          />
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            priority
            sizes='(max-width: 600px) 100vw, 600px'
            className='object-contain h-full'
          />
        </Card>
      )}
      {!post.cover && post.content && (
        <div>{shortenText(post.content, 100)}</div>
      )}
    </article>
  );
};

export default PostCard;
