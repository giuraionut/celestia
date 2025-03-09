'use client';

import React, { useState } from 'react';
import { ExtendedPost, Comment } from '@prisma/client';
import TiptapEditor from '../tiptap/TiptapEditor';
import { cn } from '@/lib/utils';
import { createComment } from '@/actions/commentActions';

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
    updateTree(comment);
    setCommentContent(''); // Clear after submitting
  };

  return (
    <div className={cn('')}>
      <TiptapEditor
        onContentChange={setCommentContent}
        className={cn('', className)}
      >
        <button
          className='bg-foreground/80 rounded p-2 text-sm font-bold text-background hover:bg-foreground cursor-pointer'
          onClick={handleSubmit}
          disabled={!commentContent.trim()}
        >
          Submit
        </button>
      </TiptapEditor>
    </div>
  );
}
