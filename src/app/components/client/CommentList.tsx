import Link from 'next/link';
import { ExtendedComment, ExtendedPost } from '@prisma/client';
import PostCard from '../presentational/PostCard';
import PostVote from './PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import Image from 'next/image';
import CommentCard from '../presentational/CommentCard';
interface PostListProps {
  comments: ExtendedComment[];
  userId?: string;
}

export default function CommentList({ comments, userId }: PostListProps) {
  return (
    <div className='py-4 w-full flex flex-col gap-4'>
      {comments.map((comment: ExtendedComment) => {
        const userVote =
          comment.votes?.find((vote) => vote.userId === userId) || null;

        return <CommentCard key={comment.id} comment={comment} />;
      })}
    </div>
  );
}
