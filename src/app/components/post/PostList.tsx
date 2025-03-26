import Link from 'next/link';
import { ExtendedPost } from '@prisma/client';
import PostCard from './PostCard';
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '../community/CommunityHeader';
import { formatDistanceToNow } from 'date-fns';

interface PostListProps {
  posts: ExtendedPost[];
  userId: string | null;
}

export default function PostList({ posts, userId }: PostListProps) {
  const validPosts = posts.filter((post) => post.community);

  return (
    <div className='w-full'>
      {validPosts.map((post) => {
        // Determine the current user's vote on this post specifically
        const userVote = userId
          ? post.votes?.find((vote) => vote.userId === userId) || null
          : null;
        const authorName = post.author?.name;

        return (
          <div
            key={post.id}
            className='h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-sm p-4'
          >
            <CommunityHeader
              name={post.community!.name}
              image={post.community!.image}
            />
            <div className='flex items-center gap-1 flex-row'>
              {authorName && (
                <span className='text-xs'>
                  Posted by{' '}
                  <Link
                    href={`/user/${authorName}`}
                    className='text-primary/50 hover:text-primary transition-colors'
                  >
                    {authorName}
                  </Link>
                </span>
              )}
              {!authorName && <p className='text-xs'>Posted by {authorName}</p>}
              <span className='text-xs'>
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </span>
            </div>
            <Link
              href={`/community/${post.community!.name}/post/${
                post.id
              }/comments`}
              className='block'
            >
              <PostCard post={post} />
            </Link>

            <div className='flex flex-row justify-between items-center'>
              <PostVote post={post} vote={userVote} userId={userId} />
              <span className='flex flex-row gap-2 items-center'>
                {post.totalComments} <MessageSquareIcon />
              </span>
            </div>
            <Separator />
          </div>
        );
      })}
    </div>
  );
}
