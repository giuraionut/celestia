import { ExtendedComment } from '@prisma/client';
import CommentCard from './CommentCard';
import CommunityHeader from '../community/CommunityHeader';
import Link from 'next/link';
import UserHoverCard from '../shared/UserHoverCard';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
interface PostListProps {
  comments: ExtendedComment[];
  userId?: string;
}

export default function CommentList({ comments, userId }: PostListProps) {
  console.log('comment list');
  return (
    <div className='w-full'>
      {comments.map((comment: ExtendedComment) => {
        const userVote =
          comment.votes?.find((vote) => vote.userId === userId) || null;
        const communityName = comment.post?.community?.name ?? 'unknown';
        const postId = comment.post?.id ?? 'unknown-post';
        return (
          <div
            key={`comment-${comment.id}`}
            className='h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 rounded-lg hover:bg-accent p-4'
          >
            {comment.post && (
              <div className='flex items-center gap-1 flex-row p-1 text-muted-foreground'>
                <CommunityHeader
                  name={comment.post.community!.name}
                  image={comment.post.community!.image}
                  textSize='text-md'
                />
                <span>•</span>
                <Link
                  href={`/community/${communityName}/post/${postId}`}
                  className='hover:underline'
                >
                  {comment.post.title || `Post ${postId}`}{' '}
                </Link>
              </div>
            )}

            <div className='flex comments-center gap-1 flex-row text-xs text-muted-foreground'>
              {comment.author ? (
                <UserHoverCard user={comment.author} />
              ) : (
                <span className='italic'>[deleted user]</span>
              )}
              <span>•</span>
              <span title={new Date(comment.createdAt).toLocaleString()}>
                {' '}
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <Link
              href={`/community/${communityName}/post/${postId}/comments/${comment.id}`}
              className='mt-1 block'
            >
              <CommentCard comment={comment} userVote={userVote} />
            </Link>

            <Separator className='mt-2' />
          </div>
        );
      })}
    </div>
  );
}
