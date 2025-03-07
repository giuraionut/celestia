'use client';

import React from 'react';

import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { HeadingIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

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

  const headingLevels = [
    { level: 1, Icon: HeadingIcon },
    { level: 2, Icon: HeadingIcon },
    { level: 3, Icon: HeadingIcon },
    { level: 4, Icon: HeadingIcon },
    { level: 5, Icon: HeadingIcon },
    { level: 6, Icon: HeadingIcon },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Toggle
          value='headings'
          aria-label='Headings'
          className={cn(
            'p-1 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500',
            {
              'bg-blue-500 text-white': headingLevels.some(({ level }) =>
                editor.isActive('heading', { level })
              ),
            },
            className
          )}
        >
          <HeadingIcon />
        </Toggle>
      </PopoverTrigger>

      <PopoverContent className='w-48 p-2 bg-white border border-gray-300 rounded-lg shadow-lg mt-2 z-20'>
        {headingLevels.map(({ level, Icon }) => (
          <Toggle
            key={level}
            value={`heading${level}`}
            aria-label={`Toggle heading ${level}`}
            className={cn(
              'flex justify-between items-center p-2 w-full text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent',
              {
                'bg-blue-500 text-white': editor.isActive('heading', { level }),
                'text-white': editor.isActive('heading', { level }),
              }
            )}
            onClick={() => handleHeading(level)}
          >
            <span>Heading {level}</span>
            <Icon className='w-4 h-4' />
          </Toggle>
        ))}
      </PopoverContent>
    </Popover>
  );
}
