import Link from 'next/link';
import { ExtendedPost, Vote } from '@prisma/client';
import PostCard from '../presentational/PostCard';
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import PostCommentsCount from '../comment/PostCommentsCount';
import { MessageSquareIcon } from 'lucide-react';
import CommunityCard from '../presentational/CommunityCard';
import Image from 'next/image';
interface PostListProps {
  posts: ExtendedPost[];
  userId?: string;
}

export default function PostList({ posts, userId }: PostListProps) {
  return (
    <div className='py-4 w-full'>
      {posts.map((post: ExtendedPost) => {
        const userVote =
          post.votes?.find((vote) => vote.userId === userId) || null;

        return (
          post.community && (
            <Link
              key={post.id}
              href={`/community/${post.community.name}/post/${post.id}/comments`}
            >
              <div className='h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4'>
                <div className='flex gap-2 items-center'>
                  <Image
                    src={post.community.image}
                    alt={post.community.name}
                    width={100}
                    height={100}
                    className='w-8 h-8 rounded-full object-contain'
                  />
                  <span className='text-xs font-bold'>
                    {post.community.name}
                  </span>
                </div>
                <PostCard post={post} />
                <div className='flex flex-row justify-between items-center'>
                  <PostVote post={post} vote={userVote} />
                  <span className='flex flex-row gap-2 items-center'>
                    {post.totalComments} <MessageSquareIcon />
                  </span>
                </div>
                <Separator />
              </div>
            </Link>
          )
        );
      })}
    </div>
  );
}
