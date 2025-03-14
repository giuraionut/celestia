'use client';

import React, { useState } from 'react';
import { ExtendedPost, Comment } from '@prisma/client';
import TiptapEditor from '../tiptap/TiptapEditor';
import { cn } from '@/lib/utils';
import { createComment } from '@/actions/commentActions';
import { Button } from '@/components/ui/button';
import { useCommentsContext } from './CommentsCountContext';

export default function CreateComment({
  className,
  post,
  updateTree,
}: {
  className?: string;
  post: ExtendedPost;
  updateTree: (comment: Comment) => void;
}) {
  const [commentContent, setCommentContent] = useState('');

  const optimisticTotalComments = useCommentsContext();
  const handleSubmit = async () => {
    if (!commentContent.trim()) return; // Prevent empty submissions

    const comment: Comment = {
      content: commentContent,
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      postId: post?.id || '',
      authorId: post?.authorId || '',
      parentId: null,
      isDeleted: false,
      totalUpvotes: 0,
      totalDownvotes: 0,
    };

    await createComment(comment);
    optimisticTotalComments.incrementCommentCount();
    updateTree(comment);
    setCommentContent(''); // Clear after submitting
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
