import Link from 'next/link';
import PostCard from '@/app/components/post/PostCard';
import PostVote from '@/app/components/post/PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '@/app/components/community/CommunityHeader';
import CommentCard from '@/app/components/comment/CommentCard';
import { formatDistanceToNow } from 'date-fns';
import PostDropDownMenu from '@/app/components/post/PostDropDownMenu';
import { OverviewItem, isOverviewPost, isOverviewComment } from '@/types/types';
import UserHoverCard from './UserHoverCard';

interface OverviewListProps {
  items: OverviewItem[];
  userId: string;
}

export default function OverviewList({ items, userId }: OverviewListProps) {
  return (
    <div className='w-full'>
      {items.map((item, index) => {
        if (isOverviewPost(item)) {
          const userVote =
            item.votes.find((vote) => vote.userId === userId) || null;
          const isSaved = item.savedBy.some((saved) => saved.userId === userId);
          const isHidden = item.hiddenBy.some(
            (hidden) => hidden.userId === userId
          );

          return (
            <div
              key={`post-${item.id}-${index}`}
              className='h-auto max-w-[700px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-lg p-4'
            >
              <CommunityHeader
                name={item.community!.name}
                image={item.community!.image}
                textSize='text-md'
              />
              <div className='flex items-center gap-1 flex-row justify-between'>
                <div className='flex items-center gap-1 flex-row text-xs'>
                  Posted by{' '}
                  {item.author && <UserHoverCard user={item.author} />}
                  <span className='text-xs'>
                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <PostDropDownMenu
                  postId={item.id}
                  isSaved={isSaved}
                  isHidden={isHidden}
                />
              </div>
              <Link
                href={`/community/${item.community!.name}/post/${
                  item.id
                }/comments`}
                className='block'
              >
                <PostCard post={item} />
              </Link>
              <div className='flex flex-row justify-between items-center'>
                <PostVote post={item} vote={userVote} userId={userId} />
                <span className='flex flex-row gap-2 items-center'>
                  {item.totalComments} <MessageSquareIcon />
                </span>
              </div>
              <Separator />
            </div>
          );
        } else if (isOverviewComment(item)) {
          const communityName = item.post?.community?.name ?? 'unknown';
          const postId = item.post?.id ?? 'unknown-post';
          const userVote =
            item.votes?.find((vote) => vote.userId === userId) || null;
          return (
            <div
              key={`comment-${item.id}-${index}`}
              className='h-auto max-w-[700px] mx-auto flex flex-col gap-2 mb-4 rounded-lg hover:bg-accent p-4'
            >
              <div className='flex items-center gap-1 flex-row p-1 text-muted-foreground'>
                <CommunityHeader
                  name={item.post.community!.name}
                  image={item.post.community!.image}
                  textSize='text-md'
                />
                <span>•</span>
                <Link
                  href={`/community/${communityName}/post/${postId}`}
                  className='hover:underline'
                >
                  {item.post.title || `Post ${postId}`}{' '}
                </Link>
              </div>

              <div className='flex items-center gap-1 flex-row text-xs'>
                Comment by{' '}
                {item.author ? (
                  <UserHoverCard user={item.author} />
                ) : (
                  <span className='italic'>[deleted user]</span>
                )}
                <span>•</span>
                <span title={new Date(item.createdAt).toLocaleString()}>
                  {' '}
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <Link
                href={`/community/${communityName}/post/${postId}/comments/${item.id}`}
                className='mt-1 block'
              >
                <CommentCard comment={item} className='' userVote={userVote} />
              </Link>

              <Separator className='mt-2' />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
