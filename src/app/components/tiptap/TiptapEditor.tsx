'use client';

import React, { useState, PropsWithChildren } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import HeadingToolbar from './toolbars/HeadingToolbar';
export default function TiptapEditor({
  className,
  children,
  initialContent,
  onContentChange,
}: {
  className?: string;
  children?: React.ReactNode;
  initialContent?: string;
  onContentChange?: (jsonData: string, plainText:string) => void;
} & PropsWithChildren) {
  const [isActive, setIsActive] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        dropcursor: { width: 2, class: 'ProseMirror-dropcursor border' },
      }),
      Placeholder.configure({ placeholder: 'Type your comment here...' }),
    ],
    autofocus: 'end',
    content: initialContent ? JSON.parse(initialContent) : '',
    onUpdate: ({ editor }) => {
      const jsonData = JSON.stringify(editor.getJSON());
      const plainText = editor.getText();
      onContentChange?.(jsonData, plainText);
    },
  });

  if (!editor) {
    return (
      <div className={`border border-border rounded-md ${className || ''}`}>
        <p>Loading editor...</p>
      </div>
    );
  }

  const handleFocusEditor = () => {
    setIsActive(true);
    editor.chain().focus();
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsActive(false);
  };

  return (
    <div
      className='hover:cursor-text border border-border/50 hover:border-border rounded-md'
      onClick={handleFocusEditor}
      onBlur={handleBlur}
      onMouseDown={(e) => e.preventDefault()}
    >
      <EditorContent
        editor={editor}
        className={`focus:outline-none ${className || ''}`}
      />
      {isActive && editor !== undefined && (
        <div className='p-1 flex justify-between'>
          <HeadingToolbar editor={editor} />
          {children}
        </div>
      )}
    </div>
  );
}
