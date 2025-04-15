// src/components/post/PostCardCompact.tsx
import React from 'react';
import Image from 'next/image';
import { ExtendedPost } from '@prisma/client';
import { cn, shortenText } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react'; // Fallback icon

interface PostCardCompactProps {
  post: ExtendedPost;
  className?: string;
}

const PostCardCompact = ({ post, className }: PostCardCompactProps) => {
  const imageSrc = post.cover; // No site-wide fallback needed here maybe

  return (
    <article className={cn('flex items-start gap-3', className)}> {/* Use items-start */}
      {/* Text Content on the Left */}
      <div className="flex-1 min-w-0"> {/* flex-1 and min-w-0 prevent overflow */}
        <h1 className='text-base font-medium leading-tight'> {/* Smaller font, tight leading */}
           {shortenText(post.title, 80)} {/* Shorter title */}
        </h1>
        {/* Optional: Show a snippet of content if no image */}
        {!imageSrc && post.content && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2"> {/* Very short snippet */}
            {shortenText(post.content, 100)}
          </p>
        )}
      </div>

      {/* Image Thumbnail on the Right */}
      {imageSrc ? (
        <div className='relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded border bg-muted'> {/* Fixed size, flex-shrink-0 */}
          <Image
            src={imageSrc}
            alt={`Thumbnail for ${post.title}`}
            fill
            sizes="(max-width: 640px) 64px, 80px" // Smaller sizes attribute
            className='object-cover' // Cover ensures the image fills the small box
          />
        </div>
      ) : (
         // Optional: Placeholder if no image
         <div className='flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded border bg-secondary/50 text-muted-foreground'>
            <ImageIcon className="w-6 h-6" />
         </div>
      )}
    </article>
  );
};

export default PostCardCompact;