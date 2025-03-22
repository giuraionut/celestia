import Link from 'next/link';
import { ExtendedPost } from '@prisma/client';
import PostCard from './PostCard';
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '../community/CommunityHeader';

interface PostListProps {
  posts: ExtendedPost[];
  userId: string | null;
}

export default function PostList({ posts, userId }: PostListProps) {
  const validPosts = posts.filter((post) => post.community);

  return (
    <div className='py-4 m-4 w-full'>
      {validPosts.map((post) => {
        // Determine the current user's vote on this post specifically
        const userVote = userId
          ? post.votes?.find((vote) => vote.userId === userId) || null
          : null;

        return (
          <div
            key={post.id}
            className='h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-md p-4'
          >
            <CommunityHeader
              name={post.community!.name}
              image={post.community!.image}
            />

            <Link
              href={`/community/${post.community!.name}/post/${post.id}/comments`}
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
