import Link from 'next/link';
import { ExtendedPost } from '@prisma/client';
import PostCard from './PostCard';
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '../community/CommunityHeader';
import { formatDistanceToNow } from 'date-fns';
import PostDropDownMenu from './PostDropDownMenu';
import { HoverCard, HoverCardContent } from '@/components/ui/hover-card';
import { HoverCardTrigger } from '@radix-ui/react-hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import UserHoverCard from '../shared/UserHoverCard';

interface PostListProps {
  posts: ExtendedPost[];
  userId: string | null;
  showHidden?: boolean;
}

export default function PostList({
  posts,
  userId,
  showHidden = false,
}: PostListProps) {
  // Filter out posts that are hidden (if applicable) or have no community
  const validPosts = posts.filter(
    (post) =>
      post.community &&
      (showHidden ||
        !userId ||
        !post.hiddenBy?.some((hidden) => hidden.userId === userId))
  );

  return (
    <div className='w-full'>
      {validPosts.length > 0 ? (
        validPosts.map((post) => {
          const isSaved = userId
            ? post.savedBy?.some((saved) => saved.userId === userId) ?? false
            : false;
          const isHidden = userId
            ? post.hiddenBy?.some((hidden) => hidden.userId === userId) ?? false
            : false;

          const userVote = userId
            ? post.votes?.find((vote) => vote.userId === userId) || null
            : null;

          return (
            <div
              key={post.id}
              className='h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-sm p-4'
            >
              <CommunityHeader
                name={post.community!.name}
                image={post.community!.image}
                textSize='text-md'
              />
              <div className='flex items-center gap-1 flex-row justify-between'>
                <div className='flex items-center gap-1 flex-row text-xs'>
                  Posted by{' '}
                  {post.author && <UserHoverCard user={post.author} />}
                  <span className='text-xs'>
                    {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <PostDropDownMenu
                  postId={post.id}
                  isSaved={isSaved}
                  isHidden={isHidden}
                />
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
        })
      ) : (
        <div className='text-center'>No posts available</div>
      )}
    </div>
  );
}
