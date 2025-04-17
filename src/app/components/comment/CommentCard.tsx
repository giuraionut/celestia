import { ExtendedComment, Vote } from '@prisma/client';
import React from 'react';
import { jsonToHtml } from '../tiptap/utils';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CommentCard = ({
  comment,
  className,
  userVote,
}: {
  comment: ExtendedComment;
  className?: string;
  userVote?: Vote | null;
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 items-start w-full container cursor-pointer',
        className
      )}
    >
      <div
        className='tiptap'
        dangerouslySetInnerHTML={{
          __html: jsonToHtml(comment.content),
        }}
      />
      <div
        className={cn('flex items-center gap-2 flex-row text-md', {
          'text-blue-500': userVote?.type === 'UPVOTE',
          'text-red-500': userVote?.type === 'DOWNVOTE',
        })}
      >
        {comment.totalUpvotes - comment.totalDownvotes}
        <button
          aria-label='Upvote comment'
          className={cn(
            'p-1 rounded hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer',
            {
              'text-blue-500 bg-blue-100 dark:bg-blue-900/50':
                userVote?.type === 'UPVOTE',
            },
            {
              'text-red-500 bg-red-100 dark:bg-red-900/50':
                userVote?.type === 'DOWNVOTE',
            }
          )}
        >
          <ChevronsUpDown size={20} />
        </button>
      </div>
    </div>
  );
};

export default CommentCard;
