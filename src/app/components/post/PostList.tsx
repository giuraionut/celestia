import Link from 'next/link';
import { ExtendedPost } from '@prisma/client';
import PostCard from './PostCard';
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '../community/CommunityHeader';
import { formatDistanceToNow } from 'date-fns';
import PostDropDownMenu from './PostDropDownMenu';

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
      {validPosts.map((post) => {
        // Compute the current user's saved and hidden status for each post.
        // Use ?? false to default to false when the optional chaining returns undefined.
        const isSaved = userId
          ? post.savedBy?.some((saved) => saved.userId === userId) ?? false
          : false;
        const isHidden = userId
          ? post.hiddenBy?.some((hidden) => hidden.userId === userId) ?? false
          : false;

        // Determine the current user's vote on the post
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
            <div className='flex items-center gap-1 flex-row justify-between'>
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
                {!authorName && (
                  <p className='text-xs'>Posted by {authorName}</p>
                )}
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
      })}
    </div>
  );
}
