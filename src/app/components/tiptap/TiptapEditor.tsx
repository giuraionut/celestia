'use client';

import React, { PropsWithChildren } from 'react';
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
  onContentChange?: (jsonData: string, plainText: string) => void;
} & PropsWithChildren) {
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
      <div className={`border border-border rounded-sm ${className || ''}`}>
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className='border border-border rounded-sm group p-4'>
      <EditorContent editor={editor} />
      <div className='group-focus-within:flex hidden justify-between  items-center mt-4'>
        <HeadingToolbar editor={editor} />
        {children}
      </div>
    </div>
  );
}
