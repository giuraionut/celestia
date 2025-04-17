// src/app/components/community/CommunityPostOptions.tsx
'use client';

import React, { useTransition } from 'react';
import { MoreHorizontal, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  removePostFromCommunity,
  restorePostToCommunity,
} from '@/actions/communityActions';
import { ExtendedCommunity } from '@prisma/client';
// Assume you have these server actions defined elsewhere

type CommunityPostOptionsProps = {
  postId: string;
  isRemovedFromCommunity: boolean;
  community: ExtendedCommunity;
};

export default function CommunityPostManagerOptions({
  postId,
  isRemovedFromCommunity,
  community,
}: CommunityPostOptionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await removePostFromCommunity(postId, community.id);
        toast.success(`Post ${result?.postId} removed successfully.`);
      } catch (error: unknown) {
        toast.error('Failed to remove post, try again later.', {
          description: (error as Error).message,
        });
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      try {
        const result = await restorePostToCommunity(postId, community.id);
        toast.success(`Post ${result?.postId} restored successfully.`);
      } catch (error: unknown) {
        toast.error(`Failed to restore post, try again later.`, {
          description: (error as Error).message,
        });
      }
    });
  };

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Post Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {!isRemovedFromCommunity ? (
            <>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className='text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  <span>Delete Post</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </>
          ) : (
            <DropdownMenuItem onClick={handleRestore} disabled={isPending} className='cursor-pointer'>
              <RotateCcw className='mr-2 h-4 w-4' />
              <span>Restore Post</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the post as deleted and hide it from view. It
            can be restored later. Are you sure you want to delete this post?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isPending ? 'Deleting...' : 'Delete Post'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
