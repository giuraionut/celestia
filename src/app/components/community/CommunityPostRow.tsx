import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ExtendedCommunity, ExtendedPost } from '@prisma/client';
import CommunityPostManagerOptions from './CommunityPostManagerOptions';
import Link from 'next/link';

type CommunityPostRowProps = {
  community: ExtendedCommunity;
  post: ExtendedPost;
  canManagePosts: boolean;
};

export default function CommunityPostRow({
  community,
  post,
  canManagePosts,
}: CommunityPostRowProps) {
  const isRemovedFromCommunity = !!post.removedFromCommunity;
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 hover:bg-muted/50 rounded-lg',
        isRemovedFromCommunity && 'opacity-60'
      )}
    >
      <div className='flex items-center gap-3 flex-grow min-w-0'>
        {post.cover && (
          <div className='flex-shrink-0'>
            <Image
              src={post.cover}
              alt={`Image for post "${post.title}"`}
              width={64}
              height={36}
              className='rounded object-cover h-9 w-16'
            />
          </div>
        )}
        <Link
          className='flex flex-col min-w-0'
          href={`/community/${community.name}/post/${post.id}/comments`}
        >
          <span className='text-sm font-medium truncate' title={post.title}>
            {post.title}
          </span>
          <span className='text-xs text-muted-foreground truncate'>
            by {post.author?.name || 'Unknown'}
          </span>
        </Link>
        {isRemovedFromCommunity && (
          <span className='ml-2 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full flex-shrink-0'>
            Deleted
          </span>
        )}
      </div>

      {canManagePosts && (
        <div className='flex-shrink-0'>
          <CommunityPostManagerOptions
            postId={post.id}
            community={community}
            isRemovedFromCommunity={isRemovedFromCommunity}
          />
        </div>
      )}
    </div>
  );
}
