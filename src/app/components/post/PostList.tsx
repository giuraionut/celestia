import Link from 'next/link';
import { ExtendedPost } from '@prisma/client';
import PostCard from './PostCard';
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '../community/CommunityHeader';

interface PostListProps {
  posts: ExtendedPost[];
  userId?: string;
}

export default function PostList({ posts, userId }: PostListProps) {
  const validPosts = posts.filter((post) => post.community);
  const voteMap = new Map(
    validPosts.flatMap(
      (post) => post.votes?.map((vote) => [vote.userId, vote]) || []
    )
  );

  console.log('post list');
  return (
    <div className='py-4 w-full'>
      {validPosts.map((post) => {
        const userVote = userId ? voteMap.get(userId) || null : null;

        return (
          <div
            key={post.id}
            className='h-auto max-w-[700px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-md p-4'
          >
            <CommunityHeader
              name={post.community!.name}
              image={post.community!.image}
            />

            <Link
              href={`/community/${post.community!.name}/post/${
                post.id
              }/comments`}
              className='block'
            >
              <PostCard post={post} />
            </Link>

            <div className='flex flex-row justify-between items-center'>
              <PostVote post={post} vote={userVote} />
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
