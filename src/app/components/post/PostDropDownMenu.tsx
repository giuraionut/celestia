'use client';
import {
  hidePost,
  savePost,
  unhidePost,
  unsavePost,
} from '@/actions/postActions';
import {
  DropdownMenu,
  DropdownMenuShortcut,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { EllipsisIcon } from 'lucide-react';
import React, { startTransition } from 'react';
import { toast } from 'sonner';

const PostDropDownMenu = ({
  postId,
  isSaved,
  isHidden,
}: {
  postId: string;
  isSaved: boolean;
  isHidden: boolean;
}) => {
  const handleSavePost = async () => {
    startTransition(async () => {
      if (isSaved) {
        try {
          await unsavePost(postId);
          toast.success(`Post unsaved successfully`);
        } catch (error: unknown) {
          toast.error('Failed to save post', {
            description: (error as Error).message,
          });
        }
      } else {
        try {
          await savePost(postId);
          toast.success(`Post saved successfully`);
        } catch (error: unknown) {
          toast.error('Failed to save post', {
            description: (error as Error).message,
          });
        }
      }
    });
  };
  const handleHidePost = async () => {
    startTransition(async () => {
      if (isHidden) {
        try {
          await unhidePost(postId);
          toast.success(`Post unhidden successfully`);
        } catch (error: unknown) {
          toast.error('Failed to hide post', {
            description: (error as Error).message,
          });
        }
      } else {
        try {
          await hidePost(postId);
          toast.success(`Post hidden successfully`);
        } catch (error: unknown) {
          toast.error('Failed to hide post', {
            description: (error as Error).message,
          });
        }
      }
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <EllipsisIcon className='cursor-pointer hover:bg-secondary rounded-lg' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Post Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSavePost}>
            {isSaved ? 'Unsave' : 'Save'}
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleHidePost}>
            {isHidden ? 'Unhide' : 'Hide'}
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostDropDownMenu;
