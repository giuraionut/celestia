'use client';
import { hidePost, savePost } from '@/actions/postActions';
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
import React from 'react';
import { toast } from 'sonner';

const PostDropDownMenu = ({ postId }: { postId: string }) => {
  const handleSavePost = async () => {
    try {
      const savedPost = await savePost(postId);
      toast.success(`Post saved successfully`);
    } catch (error: unknown) {
      toast.error('Failed to save post', {
        description: (error as Error).message,
      });
    }
  };
  const handleHidePost = async () => {
    try {
      const hiddenPost = await hidePost(postId);
      toast.success(`Post hidden successfully`);
    } catch (error: unknown) {
      toast.error('Failed to hide post', {
        description: (error as Error).message,
      });
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <EllipsisIcon className='cursor-pointer hover:bg-secondary rounded-lg' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Post {postId}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSavePost}>
            Save
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleHidePost}>
            Hide
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostDropDownMenu;
