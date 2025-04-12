// src/app/components/overview/OverviewList.tsx (assuming component location)
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

interface OverviewListProps {
  items: OverviewItem[];
  userId: string;
}

export default function OverviewList({ items, userId }: OverviewListProps) {
  return (
    <div className="w-full">
      {items.map((item, index) => {
        // Use the type guard for cleaner differentiation
        if (isOverviewPost(item)) {
          // item is now correctly typed as OverviewPost
          const userVote = item.votes.find((vote) => vote.userId === userId) || null; // Assuming votes is always an array
          const isSaved = item.savedBy.some((saved) => saved.userId === userId); // Assuming savedBy is always an array
          const isHidden = item.hiddenBy.some((hidden) => hidden.userId === userId); // Assuming hiddenBy is always an array

          // Defensive check for community (if it can truly be null)
          const communityName = item.community?.name ?? 'unknown';
          const communityImage = item.community?.image ?? ''; // Provide default image

          return (
            <div
              key={`post-${item.id}-${index}`} // Use item.id for a stable key
              className="h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 hover:bg-primary/10 rounded-sm p-4 border"
            >
              <CommunityHeader
                name={communityName}
                image={communityImage}
              />
              <Link
                href={`/community/${communityName}/post/${item.id}/comments`}
                className="block"
              >
                {/* Ensure PostCard expects an object compatible with OverviewPost */}
                <PostCard post={item} />
              </Link>
              <div className="flex flex-row justify-between items-center">
                <PostDropDownMenu postId={item.id} isSaved={isSaved} isHidden={isHidden} />
                <div className="flex flex-row gap-1 items-center">
                   {/* Ensure PostVote expects an object compatible with OverviewPost */}
                  <PostVote post={item} vote={userVote} userId={userId} />
                  <span className="flex flex-row gap-2 items-center">
                    {/* totalComments should exist directly on item now */}
                    {item.totalComments ?? 0} <MessageSquareIcon />
                  </span>
                </div>
              </div>
              <div className="text-xs">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </div>
              <Separator />
            </div>
          );
        } else if (isOverviewComment(item)) {
           // item is now correctly typed as OverviewComment
           // Defensive checks for post and community name
           const communityName = item.post?.community?.name ?? 'unknown';
           const postId = item.post?.id ?? 'unknown-post';

          return (
            <Link
              key={`comment-${item.id}-${index}`} // Use item.id for a stable key
              className="h-auto max-w-[600px] mx-auto flex flex-col gap-2 mb-4 rounded-sm hover:bg-accent p-4 border" // Added padding/border for consistency
              href={`/community/${communityName}/post/${postId}/comments/${item.id}`}
            >
               {/* Ensure CommentCard expects an object compatible with OverviewComment */}
              <CommentCard comment={item} />
              {/* Optionally add timestamp or other info here if needed */}
               <div className="text-xs text-muted-foreground mt-1">
                Commented {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })} on post in c/{communityName}
              </div>
              <Separator className="mt-2"/>
            </Link>
          );
        }
        return null; // Should not happen if items only contain valid OverviewItems
      })}
    </div>
  );
}