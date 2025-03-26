import { ExtendedComment } from '@prisma/client';
import CommentCard from './CommentCard';
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

        return (
          <div
            key={comment.id}
            className='h-auto max-w-[700px] mx-auto flex flex-col gap-2 mb-4 rounded-sm p-4'
          >
            <CommentCard comment={comment} />
          </div>
        );
      })}
    </div>
  );
}
