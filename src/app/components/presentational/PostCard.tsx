import React from 'react';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import { ExtendedPost } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PostVote from '../client/PostVote';

interface PostCardProps {
  post: ExtendedPost;
}

const PostCard = async ({ post }: PostCardProps) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Find the current user's vote (if any)
  const userVote = post.votes?.find((vote) => vote.userId === userId) || null;

  return (
    <article className='flex flex-col gap-4'>
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
          fill
          className='object-cover blur scale-110'
        />
        {/* Foreground Image */}
        <Image
          src={post.cover}
          alt={post.title}
          fill
          className='object-contain'
        />
      </div>

      {/* Footer: Votes & Comments */}
      <footer className='flex items-center justify-between'>
        {/* Vote Buttons (client component with optimistic update) */}
        <PostVote post={post} vote={userVote} />

        {/* Comments Section */}
        <div className='flex items-center gap-2'>
          <span>{post.totalComments}</span>
          <MessageSquare />
        </div>
      </footer>
    </article>
  );
};

export default PostCard;
