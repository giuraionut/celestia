'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { HeadingIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

export default function HeadingToolbar({
  editor,
  className,
}: {
  editor: Editor;
  className?: string;
}) {
  const handleHeading = (levelParam: number) => {
    const level = levelParam as Level;
    editor.chain().focus().toggleHeading({ level }).run();
  };

  // Get the active heading attributes (if any)
  const activeHeadingAttrs = editor.getAttributes('heading');
  const activeLevel = activeHeadingAttrs.level;

  const headingLevels = [
    { level: 1, Icon: HeadingIcon },
    { level: 2, Icon: HeadingIcon },
    { level: 3, Icon: HeadingIcon },
    // { level: 4, Icon: HeadingIcon },
    // { level: 5, Icon: HeadingIcon },
    // { level: 6, Icon: HeadingIcon },
  ];

  return (
    <div className={cn('', className)}>
      {headingLevels.map(({ level, Icon }) => (
        <Button
          variant='ghost'
          key={level}
          value={`heading${level}`}
          aria-label={`Toggle heading ${level}`}
          className={cn('w-6 h-6 rounded-sm', {
            'bg-primary text-white': activeLevel === level,
          })}
          onClick={() => handleHeading(level)}
        >
          <span className='flex items-center'>
            <Icon className='w-4 h-4'/>
            {level}
          </span>
        </Button>
      ))}
    </div>
  );
}
