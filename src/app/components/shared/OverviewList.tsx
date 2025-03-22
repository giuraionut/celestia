// app/components/overview/OverviewList.tsx
import React from 'react';
import Link from 'next/link';
import PostCard from '@/app/components/post/PostCard';
import PostVote from '@/app/components/post/PostVote';
import { Separator } from '@/components/ui/separator';
import { MessageSquareIcon } from 'lucide-react';
import CommunityHeader from '@/app/components/community/CommunityHeader';
import CommentCard from '@/app/components/comment/CommentCard';

interface OverviewListProps {
  items: Array<any>;
  userId: string;
}

export default function OverviewList({ items, userId }: OverviewListProps) {
  return (
    <div className="py-4 w-full">
      {items.map((item, index) => {
        if (item.type === 'post') {
          // Render post exactly as in PostList
          const userVote = userId
            ? item.votes?.find((vote: any) => vote.userId === userId) || null
            : null;
          return (
            <div
              key={`post-${item.id}-${index}`}
              className="h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-md p-4"
            >
              <CommunityHeader
                name={item.community?.name}
                image={item.community?.image}
              />
              <Link
                href={`/community/${item.community?.name}/post/${item.id}/comments`}
                className="block"
              >
                <PostCard post={item} />
              </Link>
              <div className="flex flex-row justify-between items-center">
                <PostVote post={item} vote={userVote} userId={userId} />
                <span className="flex flex-row gap-2 items-center">
                  {item.totalComments} <MessageSquareIcon />
                </span>
              </div>
              <Separator />
            </div>
          );
        } else if (item.type === 'comment') {
          // Render comment exactly as in CommentList
          return (
            <Link
              key={`comment-${item.id}-${index}`}
              className="h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 rounded-md p-4"
              href={`/community/${item.post?.community?.name}/post/${item.post?.id}/comments#${item.id}`}
            >
              <CommentCard comment={item} />
            </Link>
          );
        }
        return null;
      })}
    </div>
  );
}
