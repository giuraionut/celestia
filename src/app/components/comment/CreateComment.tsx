'use client';

import React, { startTransition, useState } from 'react';
import { ExtendedPost, Comment, ExtendedComment } from '@prisma/client';
import TiptapEditor from '../tiptap/TiptapEditor';
import { cn } from '@/lib/utils';
import { createComment } from '@/actions/commentActions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CreateComment({
  className,
  post,
  updateTree,
}: {
  className?: string;
  post: ExtendedPost;
  updateTree: (comment: ExtendedComment) => void;
}) {
  const [commentContent, setCommentContent] = useState('');

  const handleSubmit = async () => {
    if (!commentContent.trim()) return; // Prevent empty submissions

    const comment: Comment = {
      content: commentContent,
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      postId: post?.id || '',
      authorId: '',
      parentId: null,
      isDeleted: false,
      totalUpvotes: 0,
      totalDownvotes: 0,
      voteScore: 0,
    };

    startTransition(async () => {
      try {
        const createdComment = await createComment(comment);
        if (createdComment) updateTree(createdComment);
        setCommentContent('');
        toast.success('Comment created successfully');
      } catch (error) {
        toast.error('Failed to create comment', {
          description: (error as Error).message,
        });
      }
    });
  };

  return (
    <TiptapEditor
      onContentChange={setCommentContent}
      className={cn('', className)}
    >
      <Button
        className='text-sm font-bold hover:bg-foreground cursor-pointer'
        onClick={handleSubmit}
        disabled={!commentContent.trim()}
      >
        Submit
      </Button>
    </TiptapEditor>
  );
}
