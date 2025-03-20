'use client';

import React, { useState } from 'react';
import { ExtendedPost, Comment, ExtendedComment } from '@prisma/client';
import TiptapEditor from '../tiptap/TiptapEditor';
import { cn } from '@/lib/utils';
import { createComment } from '@/actions/commentActions';
import { Button } from '@/components/ui/button';

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
      voteScore: 0
    };

    const createdComment = await createComment(comment);
    if (createdComment) updateTree(createdComment);
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
