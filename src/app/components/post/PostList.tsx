import Link from 'next/link';
import { ExtendedPost } from '@prisma/client';
// import PostCard from './PostCard'; // Will be renamed
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '../community/CommunityHeader';
import { formatDistanceToNow } from 'date-fns';
import PostDropDownMenu from './PostDropDownMenu';
import UserHoverCard from '../shared/UserHoverCard';
import PostCardCompact from './PostCardCompact';
import PostCard from './PostCard';

type ViewMode = 'large' | 'compact';

interface PostListProps {
  posts: ExtendedPost[];
  userId: string | null;
  showHidden?: boolean;
  view?: ViewMode;
}

export default function PostList({
  posts,
  userId,
  showHidden = false,
  view,
}: PostListProps) {
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
        const isSaved = userId
          ? post.savedBy?.some((saved) => saved.userId === userId) ?? false
          : false;
        const isHidden = userId
          ? post.hiddenBy?.some((hidden) => hidden.userId === userId) ?? false
          : false;

        const userVote = userId
          ? post.votes?.find((vote) => vote.userId === userId) || null
          : null;

        const postUrl = `/community/${post.community!.name}/post/${
          post.id
        }/comments`;

        const commonWrapperClasses =
          'max-w-[600px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-sm p-4';

        return (
          <div key={post.id} className={commonWrapperClasses}>
            <CommunityHeader
              name={post.community!.name}
              image={post.community!.image}
              textSize='text-md'
            />
            <div className='flex items-center gap-1 flex-row justify-between'>
              <div className='flex items-center gap-1 flex-row text-xs'>
                Posted by {post.author && <UserHoverCard user={post.author} />}
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
            {view === 'compact' ? (
              <Link href={postUrl} className='block'>
                <PostCardCompact post={post} />
              </Link>
            ) : (
              <Link href={postUrl} className='block'>
                <PostCard post={post} />
              </Link>
            )}
            <div className='flex flex-row justify-between items-center mt-2'>
              {' '}
              <PostVote post={post} vote={userVote} userId={userId} />
              <Link
                href={postUrl}
                className='flex flex-row gap-2 items-center hover:underline text-sm'
              >
                {post.totalComments} <MessageSquareIcon className='h-4 w-4' />{' '}
                <span className='hidden sm:inline'>Comments</span>{' '}
              </Link>
            </div>
            <Separator className='mt-2' />
          </div>
        );
      })}
    </div>
  );
}
